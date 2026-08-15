from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.models.schema import (
    Create_Account,
    Update_Account,
    ProfileResponse,
    OtpVerify,
    OtpResend,
    UpdateProfileResponse,
    GoogleLoginRequest,
)
from app.models.tables import Create_Account_Table
from app.crud.user import (
    create_account,
    validate_registration,
    get_profile,
    update_profile,
    delete_profile,
    oauth2_scheme,
)
from app.database.database import get_db
from app.Auth.utils import get_user, verify_password, pwd_context
from app.Auth.auth import create_token, verify_token
from app.Auth.otp import generate_otp, store_otp, verify_otp, has_pending_otp
from app.Auth.google import verify_google_token
from app.config import settings
from app.dependencies.auth import get_current_user
from app.email.email import send_email, load_template

router = APIRouter()


# ─── Login ───────────────────────────────────────────────────────
@router.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user_data = get_user(db, form_data.username)
    if not user_data:
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    # Guard: Google-only users cannot use password login
    if user_data.auth_provider == "google" and not user_data.password:
        raise HTTPException(
            status_code=400,
            detail="This account uses Google sign-in. Please use the Google button.",
        )

    if not verify_password(form_data.password, user_data.password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    if not user_data.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    html_body = load_template("welcome.html", user_name=user_data.name)
    await send_email(
        to=user_data.email,
        subject="Welcome back to Finance API",
        html_body=html_body,
    )
    access_token = create_token(
        data={"sub": str(user_data.id), "tv": user_data.token_version}
    )
    return {"access_token": access_token, "token_type": "bearer"}


# ─── Registration (Step 1: send OTP) ────────────────────────────
@router.post("/create-account")
async def create_account_step1(
    user: Create_Account,
    db: Session = Depends(get_db),
):
    """Validate input, generate OTP, email it. Account is NOT created yet."""
    validate_registration(db, user)

    otp = generate_otp()
    # Stash the full registration payload alongside the OTP
    store_otp(
        email=user.email,
        otp=otp,
        purpose="registration",
        payload=user.model_dump(),
    )

    html_body = load_template(
        "otp_verification.html",
        otp_code=otp,
        purpose_text="Use this code to verify your email and complete registration.",
    )
    await send_email(
        to=user.email,
        subject="Your verification code — Finance API",
        html_body=html_body,
    )
    return {"message": "OTP sent to your email"}


# ─── Registration (Step 2: verify OTP & create account) ─────────
@router.post("/verify-registration-otp", response_model=ProfileResponse)
async def create_account_step2(
    body: OtpVerify,
    db: Session = Depends(get_db),
):
    """Verify OTP and create the account."""
    try:
        payload = verify_otp(body.email, body.otp, purpose="registration")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Re-create the Pydantic model from the stashed payload
    user = Create_Account(**payload)
    # Re-validate against DB (email could have been taken in the meantime)
    return create_account(db, user)


# ─── Resend registration OTP ────────────────────────────────────
@router.post("/resend-otp")
async def resend_registration_otp(
    body: OtpResend,
    db: Session = Depends(get_db),
):
    """Resend a new OTP for a pending registration."""
    if not has_pending_otp(body.email, purpose="registration"):
        raise HTTPException(
            status_code=400,
            detail="No pending registration found. Please register again.",
        )

    # Generate a fresh OTP (the old one is overwritten)
    otp = generate_otp()
    # Re-store with same purpose — store_otp overwrites existing entry
    # We need the original payload, but store_otp just overwrites.
    # So we first verify-then-re-store pattern won't work cleanly.
    # Instead, we peek at the store (import the internal dict — acceptable here).
    from app.Auth.otp import _otp_store, _store_lock, OTP_TTL_SECONDS
    import time

    key = (body.email.lower(), "registration")
    with _store_lock:
        entry = _otp_store.get(key)
        if entry is None:
            raise HTTPException(
                status_code=400,
                detail="No pending registration found. Please register again.",
            )
        entry["otp"] = otp
        entry["expires_at"] = time.time() + OTP_TTL_SECONDS

    html_body = load_template(
        "otp_verification.html",
        otp_code=otp,
        purpose_text="Use this code to verify your email and complete registration.",
    )
    await send_email(
        to=body.email,
        subject="Your new verification code — Finance API",
        html_body=html_body,
    )
    return {"message": "A new OTP has been sent to your email"}


# ─── Google Sign-In ──────────────────────────────────────────────
@router.post("/google-login")
async def google_login(
    body: GoogleLoginRequest,
    db: Session = Depends(get_db),
):
    """
    Sign in (or sign up) with Google.
    - If the user exists (by google_id or email) → log in
    - If the user is new → auto-create account
    - If email matches an existing local account → link it
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="Google sign-in is not configured on this server.",
        )

    google_user = await verify_google_token(body.credential, settings.GOOGLE_CLIENT_ID)

    # 1. Try to find by google_id
    user_data = (
        db.query(Create_Account_Table)
        .filter(Create_Account_Table.google_id == google_user["sub"])
        .first()
    )

    # 2. If not found by google_id, try by email (account linking)
    if not user_data:
        user_data = get_user(db, google_user["email"])
        if user_data:
            # Link Google to existing account
            user_data.google_id = google_user["sub"]
            user_data.auth_provider = (
                "both" if user_data.auth_provider == "local" else user_data.auth_provider
            )
            db.commit()
            db.refresh(user_data)

    # 3. If still not found → create new account
    if not user_data:
        user_data = Create_Account_Table(
            name=google_user["name"],
            email=google_user["email"],
            password="",  # No password for Google-only users
            mobile_number="",
            re_enter_password="",
            auth_provider="google",
            google_id=google_user["sub"],
        )
        db.add(user_data)
        db.commit()
        db.refresh(user_data)

    if not user_data.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    access_token = create_token(
        data={"sub": str(user_data.id), "tv": user_data.token_version}
    )
    return {"access_token": access_token, "token_type": "bearer"}


# ─── Get current user profile ───────────────────────────────────
@router.get("/me", response_model=ProfileResponse)
async def get_current_account(
    current_user: Create_Account_Table = Depends(get_current_user),
):
    return current_user


@router.get("/{profile_id}", response_model=ProfileResponse)
async def get_profiles(
    profile_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
):
    return get_profile(db, profile_id, token)


# ─── Update profile (with email-change OTP) ─────────────────────
@router.put("/{profile_id}")
async def update_profiles(
    profile_id: int,
    user: Update_Account,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
):
    """
    Update profile. If the email is changing, an OTP is sent to the
    NEW email and only name + mobile are updated immediately.
    """
    token_data = verify_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = int(token_data.get("sub"))
    if profile_id != user_id:
        raise HTTPException(
            status_code=403, detail="Not authorized to update this profile"
        )

    user_data = (
        db.query(Create_Account_Table)
        .filter(Create_Account_Table.profile_id == profile_id)
        .first()
    )
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    email_changed = user.email.lower() != user_data.email.lower()

    if email_changed:
        # Check if the new email is already taken
        existing = (
            db.query(Create_Account_Table)
            .filter(Create_Account_Table.email == user.email)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Email already exists")

        # Send OTP to the NEW email
        otp = generate_otp()
        store_otp(
            email=user.email,
            otp=otp,
            purpose="email_change",
            payload={
                "profile_id": profile_id,
                "new_email": user.email,
            },
        )
        html_body = load_template(
            "otp_verification.html",
            otp_code=otp,
            purpose_text="Use this code to confirm your new email address.",
        )
        await send_email(
            to=user.email,
            subject="Confirm your new email — Finance API",
            html_body=html_body,
        )

    # Always update name + mobile immediately
    user_data.name = user.name
    user_data.mobile_number = user.mobile_number
    if not email_changed:
        user_data.email = user.email  # no change, but keep it consistent
    db.commit()
    db.refresh(user_data)

    if email_changed:
        return {
            "message": "OTP sent to your new email. Verify it to complete the email change.",
            "pending_field": "email",
            "profile": {
                "profile_id": user_data.profile_id,
                "name": user_data.name,
                "email": user_data.email,  # still the OLD email
                "mobile_number": user_data.mobile_number,
                "role": user_data.role,
                "is_active": user_data.is_active,
                "created_at": user_data.created_at.isoformat() if user_data.created_at else None,
            },
        }

    return {
        "profile_id": user_data.profile_id,
        "name": user_data.name,
        "email": user_data.email,
        "mobile_number": user_data.mobile_number,
        "role": user_data.role,
        "is_active": user_data.is_active,
        "created_at": user_data.created_at.isoformat() if user_data.created_at else None,
    }


# ─── Verify email change OTP ────────────────────────────────────
@router.post("/verify-email-change-otp", response_model=ProfileResponse)
async def verify_email_change(
    body: OtpVerify,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
):
    """Verify OTP and apply the email change."""
    token_data = verify_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        payload = verify_otp(body.email, body.otp, purpose="email_change")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    profile_id = payload["profile_id"]
    new_email = payload["new_email"]

    # Ensure the requesting user owns this profile
    user_id = int(token_data.get("sub"))
    if profile_id != user_id:
        raise HTTPException(
            status_code=403, detail="Not authorized to change this email"
        )

    user_data = (
        db.query(Create_Account_Table)
        .filter(Create_Account_Table.profile_id == profile_id)
        .first()
    )
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    user_data.email = new_email
    db.commit()
    db.refresh(user_data)
    return user_data


# ─── Delete profile ──────────────────────────────────────────────
@router.delete("/{profile_id}", response_model=ProfileResponse)
async def delete_profiles(
    profile_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
):
    return delete_profile(db, profile_id, token)
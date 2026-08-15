from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.admin import schemas, services
from app.database.database import get_db
from app.dependencies.auth import get_current_admin
from app.models.tables import Create_Account_Table, TransactionType

router = APIRouter(prefix="/admin", tags=["Admin"])


def _db():
    return Depends(get_db)


def _admin():
    return Depends(get_current_admin)


@router.get("/me", response_model=schemas.AdminMe)
def get_admin_me(current_admin: Create_Account_Table = _admin()):
    return schemas.AdminMe(
        profile_id=current_admin.profile_id,
        name=current_admin.name,
        email=current_admin.email,
        role=current_admin.role,
    )


# ------------------------------ User management ------------------------------


@router.get("/users", response_model=schemas.UserListResponse)
def admin_list_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = _db(),
    current_admin: Create_Account_Table = _admin(),
):
    return services.list_users(
        db,
        search=search,
        role=role,
        is_active=is_active,
        skip=skip,
        limit=limit,
    )


@router.get("/users/{user_id}", response_model=schemas.UserStats)
def admin_get_user(
    user_id: int,
    db: Session = _db(),
    current_admin: Create_Account_Table = _admin(),
):
    return services.get_user_with_stats(db, user_id)


@router.patch("/users/{user_id}/status", response_model=schemas.UserStats)
def admin_set_user_status(
    user_id: int,
    payload: schemas.UpdateUserStatus,
    db: Session = _db(),
    current_admin: Create_Account_Table = _admin(),
):
    return services.set_user_status(db, user_id, payload.is_active)


@router.patch("/users/{user_id}/role", response_model=schemas.UserStats)
def admin_set_user_role(
    user_id: int,
    payload: schemas.UpdateUserRole,
    db: Session = _db(),
    current_admin: Create_Account_Table = _admin(),
):
    return services.set_user_role(db, user_id, payload.role)


@router.post("/users/{user_id}/reset-password", response_model=schemas.UserStats)
def admin_reset_password(
    user_id: int,
    payload: schemas.ResetPasswordRequest,
    db: Session = _db(),
    current_admin: Create_Account_Table = _admin(),
):
    return services.reset_password(db, user_id, payload.new_password)


@router.post("/users/{user_id}/force-logout", response_model=schemas.UserStats)
def admin_force_logout(
    user_id: int,
    db: Session = _db(),
    current_admin: Create_Account_Table = _admin(),
):
    return services.force_logout(db, user_id)


@router.delete("/users/{user_id}", response_model=schemas.UserStats)
def admin_delete_user(
    user_id: int,
    db: Session = _db(),
    current_admin: Create_Account_Table = _admin(),
):
    return services.delete_user(db, user_id)


# --------------------------- Transaction oversight ---------------------------


@router.get("/transactions", response_model=schemas.AdminTransactionListResponse)
def admin_list_transactions(
    user_id: Optional[int] = None,
    type: Optional[TransactionType] = None,
    category: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    min_amount: Optional[int] = None,
    max_amount: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = _db(),
    current_admin: Create_Account_Table = _admin(),
):
    return services.list_transactions(
        db,
        user_id=user_id,
        type=type,
        category=category,
        date_from=date_from,
        date_to=date_to,
        min_amount=min_amount,
        max_amount=max_amount,
        search=search,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/transactions/suspicious", response_model=schemas.SuspiciousListResponse
)
def admin_suspicious_transactions(
    threshold: Optional[float] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = _db(),
    current_admin: Create_Account_Table = _admin(),
):
    return services.suspicious_transactions(db, threshold=threshold, limit=limit)


@router.patch(
    "/transactions/{transaction_id}", response_model=schemas.AdminTransactionOut
)
def admin_update_transaction(
    transaction_id: int,
    payload: schemas.AdminTransactionUpdate,
    db: Session = _db(),
    current_admin: Create_Account_Table = _admin(),
):
    return services.update_transaction(db, transaction_id, payload)


@router.delete(
    "/transactions/{transaction_id}", response_model=schemas.AdminTransactionOut
)
def admin_delete_transaction(
    transaction_id: int,
    db: Session = _db(),
    current_admin: Create_Account_Table = _admin(),
):
    return services.delete_transaction(db, transaction_id)


@router.get("/category-analytics", response_model=list[schemas.CategoryAnalyticsItem])
def admin_category_analytics(
    db: Session = _db(),
    current_admin: Create_Account_Table = _admin(),
):
    return services.category_analytics(db)


# ------------------------------ Platform stats ------------------------------


@router.get("/stats", response_model=schemas.PlatformStats)
def admin_platform_stats(
    db: Session = _db(),
    current_admin: Create_Account_Table = _admin(),
):
    return services.platform_stats(db)


# ------------------------------ Category config ------------------------------


@router.get("/categories", response_model=list[schemas.CategoryOut])
def admin_list_categories(
    db: Session = _db(),
    current_admin: Create_Account_Table = _admin(),
):
    return services.list_categories(db)


@router.post("/categories", response_model=schemas.CategoryOut)
def admin_create_category(
    payload: schemas.CategoryCreate,
    db: Session = _db(),
    current_admin: Create_Account_Table = _admin(),
):
    return services.create_category(db, payload.name)


@router.patch("/categories/{category_id}", response_model=schemas.CategoryOut)
def admin_update_category(
    category_id: int,
    payload: schemas.CategoryUpdate,
    db: Session = _db(),
    current_admin: Create_Account_Table = _admin(),
):
    return services.update_category(db, category_id, payload)


@router.delete("/categories/{category_id}", response_model=schemas.CategoryOut)
def admin_delete_category(
    category_id: int,
    db: Session = _db(),
    current_admin: Create_Account_Table = _admin(),
):
    return services.delete_category(db, category_id)


# ---------------------------------- Export -----------------------------------


@router.get("/export/users.csv")
def admin_export_users_csv(
    db: Session = _db(),
    current_admin: Create_Account_Table = _admin(),
):
    return Response(
        content=services.export_users_csv(db),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="users.csv"'},
    )


@router.get("/export/users.xlsx")
def admin_export_users_xlsx(
    db: Session = _db(),
    current_admin: Create_Account_Table = _admin(),
):
    return Response(
        content=services.export_users_xlsx(db),
        media_type=(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ),
        headers={"Content-Disposition": 'attachment; filename="users.xlsx"'},
    )


@router.get("/export/transactions.csv")
def admin_export_transactions_csv(
    db: Session = _db(),
    current_admin: Create_Account_Table = _admin(),
):
    return Response(
        content=services.export_transactions_csv(db),
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="transactions.csv"'
        },
    )


@router.get("/export/transactions.xlsx")
def admin_export_transactions_xlsx(
    db: Session = _db(),
    current_admin: Create_Account_Table = _admin(),
):
    return Response(
        content=services.export_transactions_xlsx(db),
        media_type=(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": 'attachment; filename="transactions.xlsx"'
        },
    )

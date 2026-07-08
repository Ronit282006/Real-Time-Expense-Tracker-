import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, BackgroundTasks, UploadFile, File, HTTPException, status

from app.dependencies.auth import get_current_user
from app.models.tables import Create_Account_Table
from app.Import.schema import ImportResponse
from app.Import.service import process_import_background

router = APIRouter(prefix="/import", tags=["Import"])


@router.post("/upload", response_model=ImportResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: Create_Account_Table = Depends(get_current_user),
) -> ImportResponse:
    _validate_file_extension(file.filename)

    file_path = await _save_file_to_temp(file)

    background_tasks.add_task(
        process_import_background,
        file_path=file_path,
        user_id=current_user.id,
        user_email=current_user.email,
        user_name=current_user.name,
    )

    return ImportResponse()


def _validate_file_extension(filename: str | None) -> None:
    if not filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided.",
        )
    ext = Path(filename).suffix.lower()
    if ext not in (".csv", ".xlsx", ".xls"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed: .csv, .xlsx, .xls",
        )


async def _save_file_to_temp(file: UploadFile) -> str:
    suffix = Path(file.filename).suffix.lower() if file.filename else ".csv"
    content = await file.read()
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(content)
        return tmp.name

from pydantic import BaseModel


class ImportResponse(BaseModel):
    message: str = (
        "Your file has been uploaded successfully "
        "and is being processed in the background."
    )


class RowError(BaseModel):
    row_number: int
    error: str


class ImportSummary(BaseModel):
    total_rows: int = 0
    imported_rows: int = 0
    failed_rows: int = 0
    errors: list[RowError] = []

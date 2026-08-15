import os
import logging

import redis

from app.config import settings
from app.database.database import session_local
from app.Import.parser import parse_file
from app.Import.column_mapper import map_columns, apply_mapping, check_required_columns
from app.Import.validator import validate_row
from app.Import.crud import bulk_insert_transactions
from app.Import.schema import ImportSummary, RowError
from app.Import.email import send_import_summary_email

logger = logging.getLogger(__name__)

REQUIRED_FIELDS = {"amount", "category", "type", "transaction_datetime"}
CHUNK_SIZE = 500


def process_import_background(
    file_path: str,
    user_id: int,
    user_email: str,
    user_name: str,
) -> None:
    db = None
    try:
        db = session_local()

        raw_rows = parse_file(file_path)
        if not raw_rows:
            raise ValueError("The uploaded file contains no data rows.")

        uploaded_columns = list(raw_rows[0].keys())
        column_mapping = map_columns(uploaded_columns)

        missing = check_required_columns(column_mapping)
        if missing:
            raise ValueError(
                f"Could not map required column(s): {', '.join(missing)}. "
                f"Uploaded columns: {', '.join(uploaded_columns)}"
            )

        total_rows = len(raw_rows)
        imported = 0
        failed = 0
        all_errors: list[RowError] = []

        for start in range(0, total_rows, CHUNK_SIZE):
            chunk = raw_rows[start : start + CHUNK_SIZE]
            valid_chunk: list[dict] = []

            for offset, raw_row in enumerate(chunk):
                row_number = start + offset + 2
                mapped = apply_mapping(raw_row, column_mapping)
                validated_row, row_errors = validate_row(mapped, row_number)

                if validated_row:
                    valid_chunk.append(validated_row)
                else:
                    failed += 1
                    for err in row_errors:
                        all_errors.append(RowError(row_number=row_number, error=err))

            if valid_chunk:
                try:
                    inserted = bulk_insert_transactions(db, user_id, valid_chunk)
                    imported += inserted
                except Exception:
                    logger.exception("Bulk insert failed for chunk starting at row %d", start + 2)
                    db.rollback()
                    failed += len(valid_chunk)
                    for _ in valid_chunk:
                        all_errors.append(RowError(row_number=0, error="Database insert error"))

        _delete_dashboard_cache(user_id)

        summary = ImportSummary(
            total_rows=total_rows,
            imported_rows=imported,
            failed_rows=failed,
            errors=all_errors,
        )

        send_import_summary_email(
            to=user_email,
            user_name=user_name,
            summary=summary,
        )

    except Exception:
        logger.exception("Import processing failed for user %s (file: %s)", user_id, file_path)
        try:
            error_summary = ImportSummary(
                total_rows=0,
                imported_rows=0,
                failed_rows=0,
                errors=[],
            )
            send_import_summary_email(
                to=user_email,
                user_name=user_name,
                summary=error_summary,
                status="Failed",
            )
        except Exception:
            logger.exception("Failed to send error notification email")
    finally:
        if db is not None:
            db.close()
        _cleanup_file(file_path)


def _delete_dashboard_cache(user_id: int) -> None:
    try:
        client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
        client.delete(f"dashboard:{user_id}")
        client.close()
    except Exception:
        logger.warning("Failed to delete Redis dashboard cache for user %s", user_id)


def _cleanup_file(file_path: str) -> None:
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception:
        logger.warning("Failed to clean up temp file: %s", file_path)

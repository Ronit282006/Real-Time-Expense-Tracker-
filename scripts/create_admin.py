"""Promote an existing user to admin.

Usage:
    python scripts/create_admin.py user@example.com

Run from the project root so that the `app` package is importable.
"""
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.database import session_local
from app.models.tables import Create_Account_Table


def make_admin(email: str) -> bool:
    db = session_local()
    try:
        user = (
            db.query(Create_Account_Table)
            .filter(Create_Account_Table.email == email)
            .first()
        )
        if not user:
            print(f"[ERROR] User with email '{email}' not found.")
            return False
        user.role = "admin"
        db.commit()
        print(f"[OK] Promoted '{email}' to admin.")
        return True
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/create_admin.py <user-email>")
        sys.exit(1)
    sys.exit(0 if make_admin(sys.argv[1]) else 1)

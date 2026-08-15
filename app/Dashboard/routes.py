from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import redis
from redis.exceptions import ConnectionError as RedisConnectionError

from app.config import settings
from app.database.database import get_db
from app.dependencies.auth import get_current_user
from app.models.tables import Create_Account_Table
from app.Dashboard import service, schema

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

def get_redis_client():
    """
    Dependency to yield a Redis connection, configured via REDIS_URL.
    """
    client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        client.ping()
        yield client
    except RedisConnectionError:
        # Redis is optional: fall back to a null object so the dashboard
        # still works (cache-aside degrades to direct DB reads).
        yield _RedisUnavailable()
    finally:
        client.close()


class _RedisUnavailable:
    """Minimal stand-in that mimics the redis methods used by the dashboard."""

    def get(self, *args, **kwargs):
        return None

    def setex(self, *args, **kwargs):
        return None

    def delete(self, *args, **kwargs):
        return 0

@router.get("", response_model=schema.DashboardResponse)
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: Create_Account_Table = Depends(get_current_user),
    redis_client: redis.Redis = Depends(get_redis_client)
):
    """
    Retrieve Dashboard Data.
    Follows Cache Aside Pattern: checks Redis first, falls back to PostgreSQL on Cache Miss.
    Never directly queries the Transaction API; goes straight to the Dashboard service.
    """
    return service.get_dashboard(
        db=db, 
        user_id=current_user.id, 
        redis_client=redis_client
    )

import json
from sqlalchemy.orm import Session
from redis import Redis
from app.Dashboard import crud, schema

def get_dashboard(db: Session, user_id: int, redis_client: Redis) -> schema.DashboardResponse:
    cache_key = f"dashboard:{user_id}"
    
    # 1. Check Redis Cache
    cached_data = redis_client.get(cache_key)
    if cached_data:
        # Cache Hit: Parse the cached JSON string and return as a Pydantic model
        return schema.DashboardResponse.model_validate_json(cached_data)

    # 2. Cache Miss: Calculate all values from PostgreSQL
    total_income = crud.get_total_income(db, user_id)
    total_expense = crud.get_total_expense(db, user_id)
    current_balance = total_income - total_expense
    
    transaction_count = crud.get_transaction_count(db, user_id)
    recent_transactions = crud.get_recent_transactions(db, user_id, limit=5)
    top_expense_category = crud.get_top_expense_category(db, user_id)
    
    monthly_income = crud.get_monthly_income(db, user_id)
    monthly_expense = crud.get_monthly_expense(db, user_id)
    
    monthly_summary = crud.get_monthly_summary(db, user_id)
    expense_by_category = crud.get_expense_by_category(db, user_id)

    # 3. Build Dashboard Response Pydantic Model
    dashboard_response = schema.DashboardResponse(
        total_income=total_income,
        total_expense=total_expense,
        current_balance=current_balance,
        transaction_count=transaction_count,
        monthly_income=monthly_income,
        monthly_expense=monthly_expense,
        top_expense_category=top_expense_category,
        recent_transactions=recent_transactions,
        monthly_summary=monthly_summary,
        expense_by_category=expense_by_category
    )

    # 4. Store in Redis
    # model_dump_json() serializes the Pydantic model directly to a JSON string
    redis_client.setex(
        name=cache_key,
        time=300,  # 300 seconds TTL
        value=dashboard_response.model_dump_json()
    )

    # 5. Return Response
    return dashboard_response


def invalidate_dashboard_cache(user_id: int, redis_client: Redis):
    """
    Cache invalidation function.
    Must be called inside the Transaction service whenever a transaction is:
    - Created (POST)
    - Updated (PUT)
    - Deleted (DELETE)
    """
    cache_key = f"dashboard:{user_id}"
    redis_client.delete(cache_key)

from fastapi import FastAPI
from app.database.database import engine, base
from app.Account.routes import router as account_router

from app.routers.transaction import router as transactions_router
from app.Transation.transation import router as transation_router

from app.Dashboard.routes import router as dashboard_router
from app.Import.routes import router as import_router

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}

base.metadata.create_all(bind=engine)
app.include_router(account_router, prefix="/account")

# The user's new router
app.include_router(transation_router)
app.include_router(dashboard_router)
app.include_router(import_router)
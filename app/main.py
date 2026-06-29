from app.database.database import engine,base
from app.Account.routes import router as account_router
from fastapi import FastAPI
from app.models.tables import Create_Account_Table

app = FastAPI()
  
@app.get("/")
async def root():
    return {"message": "Hello World"}
        
base.metadata.create_all(bind=engine)
app.include_router(account_router, prefix="/account")


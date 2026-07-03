from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

DATABASE_URL = settings.DATABASE_URL

engine = create_engine(DATABASE_URL, pool_size=50, max_overflow=50)
session_local = sessionmaker(bind=engine,autocommit=False, autoflush=False)
base = declarative_base()

def get_db():
    db = session_local()
    try:
        yield db
    finally:
        db.close()

import os
from dotenv import load_dotenv

load_dotenv()

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

# PostgreSQL or SQLite Database configuration
RAW_DATABASE_URL = os.environ.get("DATABASE_URL")
engine = None

if RAW_DATABASE_URL and not RAW_DATABASE_URL.startswith("sqlite"):
    try:
        # Test connection with a timeout (Neon can take a few seconds to wake up)
        test_engine = create_engine(
            RAW_DATABASE_URL,
            connect_args={"connect_timeout": 30},
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True
        )
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1;"))
            try:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.commit()
            except Exception as ve:
                print(f"pgvector extension check: {ve}")
        engine = test_engine
        print("Successfully connected to PostgreSQL database.")
    except Exception as e:
        print(f"PostgreSQL connection failed ({e}). Falling back to SQLite.")
        engine = None

if engine is None:
    SQLALCHEMY_DATABASE_URL = "sqlite:///./enterprise_rag.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)
    print("Using SQLite database: enterprise_rag.db")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

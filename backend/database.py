from sqlmodel import SQLModel, create_engine, Session
import os

# Database URL (SQLite for development, can be changed to PostgreSQL/MySQL for production)
DATABASE_URL = os.getenv("DATABASE_URL") or "sqlite:///./coaching_center.db"

# Replace postgresql:// with postgresql+psycopg://
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL and "sqlite" in DATABASE_URL else {},
    echo=False
)

# Dependency to get DB session
def get_session():
    with Session(engine) as session:
        yield session

# Function to create all tables
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

if __name__ == "__main__":
    # Import models to ensure they're registered with SQLModel
    from models import *
    create_db_and_tables()
    print("Database and tables created successfully!")
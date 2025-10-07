from sqlmodel import SQLModel, create_engine, Session
import os

# Database URL (SQLite for development, can be changed to PostgreSQL/MySQL for production)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./coaching_center.db")

# Create engine
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False  # Set to True for SQL query logging in development
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
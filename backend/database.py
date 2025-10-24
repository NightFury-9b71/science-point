from sqlmodel import SQLModel, create_engine, Session
import os
from sqlalchemy import text

# Import models to ensure they're registered with SQLModel
from models import *

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

# Function to reset database (drop all tables and recreate)
def reset_database():
    """Reset the database by dropping all tables and recreating them.
    WARNING: This will permanently delete all data!
    """
    print("⚠️  WARNING: Resetting database will delete ALL data!")

    # Check if it's PostgreSQL (Neon)
    is_postgres = "postgresql" in DATABASE_URL

    with engine.connect() as conn:
        if is_postgres:
            # PostgreSQL/Neon reset
            print("🗑️  Dropping enum types and all tables (PostgreSQL)...")

            # Drop enum types first
            drop_enums_sql = """
            DROP TYPE IF EXISTS userrole CASCADE;
            DROP TYPE IF EXISTS attendancestatus CASCADE;
            DROP TYPE IF EXISTS dayofweek CASCADE;
            """

            for statement in drop_enums_sql.strip().split(';'):
                if statement.strip():
                    conn.execute(text(statement.strip()))

            # Then drop tables
            drop_tables_sql = """
            DROP TABLE IF EXISTS teacher_reviews CASCADE;
            DROP TABLE IF EXISTS notices CASCADE;
            DROP TABLE IF EXISTS study_materials CASCADE;
            DROP TABLE IF EXISTS exam_results CASCADE;
            DROP TABLE IF EXISTS exams CASCADE;
            DROP TABLE IF EXISTS attendances CASCADE;
            DROP TABLE IF EXISTS class_schedules CASCADE;
            DROP TABLE IF EXISTS subjects CASCADE;
            DROP TABLE IF EXISTS students CASCADE;
            DROP TABLE IF EXISTS teachers CASCADE;
            DROP TABLE IF EXISTS classes CASCADE;
            DROP TABLE IF EXISTS admission_requests CASCADE;
            DROP TABLE IF EXISTS admin_creation_codes CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
            """

            for statement in drop_tables_sql.strip().split(';'):
                if statement.strip():
                    conn.execute(text(statement.strip()))

        else:
            # SQLite reset
            print("🗑️  Dropping all tables (SQLite)...")
            # For SQLite, we need to get table names and drop them
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"))
            tables = [row[0] for row in result.fetchall()]

            for table in tables:
                conn.execute(text(f"DROP TABLE IF EXISTS {table}"))

        conn.commit()
        print("✅ All enum types and tables dropped")

        # Recreate tables
        print("🏗️  Recreating tables...")
        SQLModel.metadata.create_all(engine)
        print("✅ Database reset complete!")

if __name__ == "__main__":
    create_db_and_tables()
    print("Database and tables created successfully!")
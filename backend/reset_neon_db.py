#!/usr/bin/env python3
"""
Database reset script for Neon PostgreSQL database.
This script drops all tables and recreates them with the current schema.
WARNING: This will permanently delete all data in your database!
"""

import os
import sys
from sqlalchemy import create_engine, text, MetaData
from sqlmodel import SQLModel

# Import all models at module level
from models import *

def reset_neon_database():
    """Completely reset the Neon PostgreSQL database by dropping and recreating all tables"""

    # Get database URL
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable not found!")
        print("Please set your Neon database URL:")
        print("export DATABASE_URL='postgresql://username:password@hostname/database'")
        sys.exit(1)

    # Ensure we're using PostgreSQL
    if "postgresql" not in database_url:
        print("❌ ERROR: This script is designed for PostgreSQL/Neon databases only!")
        print(f"Current DATABASE_URL appears to be for: {database_url.split('://')[0]}")
        sys.exit(1)

    # Replace postgresql:// with postgresql+psycopg:// for SQLAlchemy
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

    print("🔄 Connecting to Neon PostgreSQL database...")
    print(f"Database: {database_url.split('@')[1] if '@' in database_url else '***'}")

    try:
        # Create engine
        engine = create_engine(database_url, echo=True)

        # Test connection
        with engine.connect() as conn:
            print("✅ Connected to database successfully")

            # Confirm destructive action
            print("\n⚠️  WARNING: This will DELETE ALL DATA in your database!")
            confirm = input("Type 'YES' to confirm: ")
            if confirm != "YES":
                print("❌ Operation cancelled")
                return

            print("\n🗑️  Dropping enum types and all tables...")

            # Drop enum types first (they persist independently of tables)
            drop_enums_sql = """
            DROP TYPE IF EXISTS userrole CASCADE;
            DROP TYPE IF EXISTS attendancestatus CASCADE;
            DROP TYPE IF EXISTS dayofweek CASCADE;
            """

            # Execute enum drop commands
            for statement in drop_enums_sql.strip().split(';'):
                if statement.strip():
                    try:
                        conn.execute(text(statement.strip()))
                        print(f"✓ Dropped enum: {statement.strip().split()[2]}")
                    except Exception as e:
                        print(f"⚠️  Could not drop enum (might not exist): {e}")

            # Drop all tables in reverse dependency order
            # This handles foreign key constraints properly
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

            # Execute drop commands
            for statement in drop_tables_sql.strip().split(';'):
                if statement.strip():
                    conn.execute(text(statement.strip()))
                    print(f"✓ Dropped: {statement.strip().split()[2]}")

            # Commit the drops
            conn.commit()
            print("✅ All tables dropped successfully")

            print("\n🏗️  Recreating tables with current schema...")

            # Create all tables
            SQLModel.metadata.create_all(engine)
            print("✅ All tables created successfully")

            print("\n🎉 Database reset completed!")
            print("Your Neon database has been reset with the latest schema.")
            print("You can now seed it with mock data using: POST /admin/seed-data")

    except Exception as e:
        print(f"❌ ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    reset_neon_database()
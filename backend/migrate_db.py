#!/usr/bin/env python3
"""
Database migration script to add missing columns to existing tables.
Run this script when deploying updates that add new columns to existing tables.
"""

import os
import sys
from sqlalchemy import create_engine, text

def migrate_database():
    """Add missing columns to existing database tables"""

    # Get database URL
    database_url = os.getenv("DATABASE_URL") or "sqlite:///./coaching_center.db"

    # Replace postgresql:// with postgresql+psycopg://
    if database_url and database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

    print(f"Connecting to database: {database_url.replace(database_url.split('://')[1].split('@')[0] if '@' in database_url else '', '***')}")

    engine = create_engine(database_url, echo=True)

    with engine.connect() as conn:
        # Check if we're using PostgreSQL
        is_postgres = "postgresql" in database_url

        try:
            # Add target_role column to notices table if it doesn't exist
            if is_postgres:
                # PostgreSQL syntax
                conn.execute(text("""
                    ALTER TABLE notices
                    ADD COLUMN IF NOT EXISTS target_role VARCHAR(7)
                """))
                print("✓ Added target_role column to notices table (PostgreSQL)")
            else:
                # SQLite syntax - check if column exists first
                result = conn.execute(text("PRAGMA table_info(notices)"))
                columns = [row[1] for row in result.fetchall()]

                if 'target_role' not in columns:
                    conn.execute(text("ALTER TABLE notices ADD COLUMN target_role VARCHAR(7)"))
                    print("✓ Added target_role column to notices table (SQLite)")
                else:
                    print("✓ target_role column already exists in notices table")

            # Commit the changes
            conn.commit()
            print("Database migration completed successfully!")

        except Exception as e:
            print(f"Error during migration: {e}")
            conn.rollback()
            sys.exit(1)

if __name__ == "__main__":
    print("Starting database migration...")
    migrate_database()
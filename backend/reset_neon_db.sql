-- SQL Script to Reset Neon Database
-- Run this in your Neon SQL Editor or psql console
-- WARNING: This will permanently delete all data!

-- Step 1: Drop all tables in reverse dependency order
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

-- Step 2: The tables will be automatically recreated when you redeploy your application
-- or run the create_db_and_tables() function in your Python code
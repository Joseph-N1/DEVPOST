-- PostgreSQL initialization script
-- Creates the farm user and database if they don't exist
-- This script runs automatically in /docker-entrypoint-initdb.d/ on first container start

\echo '========================================='
\echo 'ECO FARM Database Initialization Started'
\echo '========================================='

-- Create the farm user with password (if not exists)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'farm') THEN 
    CREATE USER farm WITH PASSWORD 'changeme';
    RAISE NOTICE 'User farm created successfully';
  ELSE
    RAISE NOTICE 'User farm already exists, skipping creation';
  END IF;
END $$;

-- Create the eco_farm database owned by farm user (if not exists)
SELECT 'CREATE DATABASE eco_farm OWNER farm'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'eco_farm')\gexec
\echo 'Database eco_farm ready'

-- Grant all privileges on the database to farm user
GRANT ALL PRIVILEGES ON DATABASE eco_farm TO farm;
\echo 'Privileges granted on database'

-- Connect to the database and grant schema privileges
\c eco_farm;
\echo 'Connected to eco_farm database'

GRANT ALL ON SCHEMA public TO farm;
GRANT USAGE ON SCHEMA public TO farm;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO farm;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO farm;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO farm;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO farm;

\echo '========================================='
\echo 'ECO FARM Database Initialization Complete'
\echo '========================================='

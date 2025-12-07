-- Initialize PostgreSQL database for ECO FARM
-- This script runs automatically when the container starts

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS eco_farm;

-- Connect to the database and create extensions
\c eco_farm;

-- Create essential extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create schema
CREATE SCHEMA IF NOT EXISTS public;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'ECO FARM database initialization complete';
END
$$;

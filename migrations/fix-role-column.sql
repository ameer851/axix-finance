-- Fix role column casting issue
-- First, create the role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update the role column with proper casting
ALTER TABLE users 
ALTER COLUMN role TYPE role USING 
CASE 
    WHEN role = 'admin' THEN 'admin'::role
    WHEN role = 'user' THEN 'user'::role
    ELSE 'user'::role
END;

-- Set default value
ALTER TABLE users 
ALTER COLUMN role SET DEFAULT 'user'::role;

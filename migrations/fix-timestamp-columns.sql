-- Fix timestamp casting issues
-- Handle created_at column casting
DO $$ 
DECLARE
    tbl_name text;
    tables text[] := ARRAY['users', 'transactions', 'logs', 'messages', 'notifications'];
BEGIN
    FOREACH tbl_name IN ARRAY tables
    LOOP
        -- Check if the table exists and has created_at column
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = tbl_name AND column_name = 'created_at'
        ) THEN
            -- Try to fix the created_at column casting
            BEGIN
                EXECUTE format('ALTER TABLE %I ALTER COLUMN created_at TYPE timestamp WITHOUT TIME ZONE USING created_at::timestamp WITHOUT TIME ZONE', tbl_name);
                RAISE NOTICE 'Fixed created_at column in table: %', tbl_name;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Could not fix created_at in table %. Error: %', tbl_name, SQLERRM;
            END;
        END IF;
        
        -- Also handle updated_at column if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = tbl_name AND column_name = 'updated_at'
        ) THEN
            BEGIN
                EXECUTE format('ALTER TABLE %I ALTER COLUMN updated_at TYPE timestamp WITHOUT TIME ZONE USING updated_at::timestamp WITHOUT TIME ZONE', tbl_name);
                RAISE NOTICE 'Fixed updated_at column in table: %', tbl_name;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Could not fix updated_at in table %. Error: %', tbl_name, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

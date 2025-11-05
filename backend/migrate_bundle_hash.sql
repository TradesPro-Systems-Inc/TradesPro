-- Migration: Update bundle_hash column length from VARCHAR(64) to VARCHAR(128)
-- This is needed because bundle_hash includes 'sha256:' prefix (7 chars) + 64 hex chars = 71 chars total

-- Check if column exists and update it
DO $$
BEGIN
    -- Check if column exists and has length 64
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'calculations' 
        AND column_name = 'bundle_hash'
        AND character_maximum_length = 64
    ) THEN
        -- Update column type
        ALTER TABLE calculations ALTER COLUMN bundle_hash TYPE VARCHAR(128);
        RAISE NOTICE 'Updated bundle_hash column from VARCHAR(64) to VARCHAR(128)';
    ELSE
        -- Check if column exists with different length
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'calculations' 
            AND column_name = 'bundle_hash'
        ) THEN
            RAISE NOTICE 'bundle_hash column already has correct length or different length';
        ELSE
            RAISE NOTICE 'bundle_hash column does not exist - will be created by init.sql';
        END IF;
    END IF;
END $$;









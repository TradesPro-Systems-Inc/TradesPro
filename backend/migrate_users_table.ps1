# PowerShell script to migrate users table - add missing profile columns
# This script adds company, license_number, phone, and bio columns to the users table

$ErrorActionPreference = "Stop"

Write-Host "🔄 Migrating users table to add missing profile columns..." -ForegroundColor Cyan

# Check if Docker container is running
$containerName = "tradespro_postgres"
$containerStatus = docker ps --filter "name=$containerName" --format "{{.Status}}" 2>&1

if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($containerStatus)) {
    Write-Host "❌ Docker container '$containerName' is not running!" -ForegroundColor Red
    Write-Host "   Please start it with: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Docker container '$containerName' is running" -ForegroundColor Green

# SQL migration script
$migrationSQL = @"
-- Migration: Add missing profile columns to users table
DO `$`$
BEGIN
    -- Add company column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'company'
    ) THEN
        ALTER TABLE users ADD COLUMN company VARCHAR(255);
        RAISE NOTICE 'Added company column to users table';
    ELSE
        RAISE NOTICE 'company column already exists';
    END IF;
    
    -- Add license_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'license_number'
    ) THEN
        ALTER TABLE users ADD COLUMN license_number VARCHAR(100);
        RAISE NOTICE 'Added license_number column to users table';
    ELSE
        RAISE NOTICE 'license_number column already exists';
    END IF;
    
    -- Add phone column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'phone'
    ) THEN
        ALTER TABLE users ADD COLUMN phone VARCHAR(50);
        RAISE NOTICE 'Added phone column to users table';
    ELSE
        RAISE NOTICE 'phone column already exists';
    END IF;
    
    -- Add bio column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'bio'
    ) THEN
        ALTER TABLE users ADD COLUMN bio TEXT;
        RAISE NOTICE 'Added bio column to users table';
    ELSE
        RAISE NOTICE 'bio column already exists';
    END IF;
END `$`$;
"@

# Execute migration
Write-Host "📝 Applying migration..." -ForegroundColor Cyan
$migrationSQL | docker exec -i $containerName psql -U tradespro_user -d tradespro

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verifying columns..." -ForegroundColor Cyan
    
    # Verify columns exist
    $verifySQL = @"
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name IN ('company', 'license_number', 'phone', 'bio')
ORDER BY column_name;
"@
    
    $verifySQL | docker exec -i $containerName psql -U tradespro_user -d tradespro
    
    Write-Host ""
    Write-Host "✅ Users table migration complete!" -ForegroundColor Green
} else {
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    exit 1
}










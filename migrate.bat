@echo off
echo ========================================
echo   AIvonis: SQLite to PostgreSQL Migration
echo ========================================
echo.

echo Step 1: Exporting data from SQLite...
node export-sqlite-data.js
if %errorlevel% neq 0 (
    echo ERROR: Failed to export data from SQLite
    pause
    exit /b 1
)
echo.

echo Step 2: Updating Prisma schema to PostgreSQL...
echo Please ensure you have:
echo   1. Created a PostgreSQL database
echo   2. Updated DATABASE_URL in .env file
echo   3. Changed provider to "postgresql" in schema.prisma
echo.
pause

echo Step 3: Pushing schema to PostgreSQL...
call npx prisma db push --force-reset
if %errorlevel% neq 0 (
    echo ERROR: Failed to push schema to PostgreSQL
    pause
    exit /b 1
)
echo.

echo Step 4: Importing data to PostgreSQL...
node import-to-postgres.js
if %errorlevel% neq 0 (
    echo ERROR: Failed to import data to PostgreSQL
    pause
    exit /b 1
)
echo.

echo Step 5: Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma Client
    pause
    exit /b 1
)
echo.

echo ========================================
echo   Migration completed successfully! ✓
echo ========================================
echo.
echo Next steps:
echo   1. Verify data in Prisma Studio: npx prisma studio
echo   2. Restart your application: npm run dev
echo   3. Keep prisma-export.json as backup
echo.
pause

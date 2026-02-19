# PowerShell script to setup PostgreSQL database for AIvonis

$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$sqlFile = "setup-db.sql"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setting up PostgreSQL Database" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if psql exists
if (-not (Test-Path $psqlPath)) {
    Write-Host "ERROR: PostgreSQL psql.exe not found at: $psqlPath" -ForegroundColor Red
    Write-Host "Please install PostgreSQL or update the path in this script." -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "Found PostgreSQL at: $psqlPath" -ForegroundColor Green
Write-Host ""
Write-Host "You will be prompted for the PostgreSQL 'postgres' user password." -ForegroundColor Yellow
Write-Host "This is the password you set during PostgreSQL installation." -ForegroundColor Yellow
Write-Host ""

# Execute SQL file
& $psqlPath -U postgres -f $sqlFile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Database created successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Database: aivonis" -ForegroundColor Cyan
    Write-Host "User: aivonis_user" -ForegroundColor Cyan
    Write-Host "Password: YourSecurePassword123" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next step: Run the migration script" -ForegroundColor Yellow
    Write-Host "  .\migrate.bat" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to create database" -ForegroundColor Red
    Write-Host "Please check the error message above." -ForegroundColor Yellow
}

Write-Host ""
pause

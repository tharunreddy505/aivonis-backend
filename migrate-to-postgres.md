# Migration Guide: SQLite to PostgreSQL

## Prerequisites
- PostgreSQL installed locally
- Current SQLite database with data at `prisma/dev.db`

## Step 1: Create PostgreSQL Database

Open your PostgreSQL command line (psql) or pgAdmin and run:

```sql
CREATE DATABASE aivonis;
CREATE USER aivonis_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE aivonis TO aivonis_user;
```

Or use this command in PowerShell:
```powershell
# Connect to PostgreSQL (default user is usually 'postgres')
psql -U postgres

# Then run the SQL commands above
```

## Step 2: Update Environment Variables

Update your `.env` file with the PostgreSQL connection string:

```env
DATABASE_URL="postgresql://aivonis_user:your_secure_password@localhost:5432/aivonis?schema=public"
```

## Step 3: Update Prisma Schema

Change the datasource in `prisma/schema.prisma` from:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

To:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Step 4: Install Migration Tool

Install `prisma-db-push` or use a data export/import approach:

```bash
npm install -g prisma
```

## Step 5: Export Data from SQLite

Run this Node.js script to export your data:

```bash
node export-sqlite-data.js
```

## Step 6: Push Schema to PostgreSQL

```bash
npx prisma db push
```

## Step 7: Import Data to PostgreSQL

```bash
node import-to-postgres.js
```

## Step 8: Verify Migration

```bash
npx prisma studio
```

Check that all your data is present in the new PostgreSQL database.

## Step 9: Update Prisma Client

```bash
npx prisma generate
```

## Step 10: Restart Your Application

```bash
npm run dev
```

## Troubleshooting

- If you get connection errors, check PostgreSQL is running: `pg_isready`
- Verify your credentials and database name
- Check firewall settings if PostgreSQL is not accessible

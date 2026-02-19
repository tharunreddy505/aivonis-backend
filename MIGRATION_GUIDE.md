# Quick Migration Steps

## 🚀 Fast Track (Automated)

### Prerequisites:
1. **Create PostgreSQL Database** (run in psql or pgAdmin):
   ```sql
   CREATE DATABASE aivonis;
   CREATE USER aivonis_user WITH PASSWORD 'YourSecurePassword123';
   GRANT ALL PRIVILEGES ON DATABASE aivonis TO aivonis_user;
   ```

2. **Update `.env` file**:
   ```env
   DATABASE_URL="postgresql://aivonis_user:YourSecurePassword123@localhost:5432/aivonis?schema=public"
   ```

3. **Update `prisma/schema.prisma`** (lines 5-8):
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

### Run Migration:
```bash
# Option 1: Automated (Windows)
migrate.bat

# Option 2: Manual Steps
node export-sqlite-data.js
npx prisma db push --force-reset
node import-to-postgres.js
npx prisma generate
npm run dev
```

---

## 📋 Manual Step-by-Step

### 1. Create PostgreSQL Database
```powershell
# Open PowerShell and connect to PostgreSQL
psql -U postgres

# In psql, run:
CREATE DATABASE aivonis;
CREATE USER aivonis_user WITH PASSWORD 'YourSecurePassword123';
GRANT ALL PRIVILEGES ON DATABASE aivonis TO aivonis_user;
\q
```

### 2. Update Environment Variables
Edit `.env` file:
```env
DATABASE_URL="postgresql://aivonis_user:YourSecurePassword123@localhost:5432/aivonis?schema=public"
```

### 3. Update Prisma Schema
Edit `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"  # Changed from "sqlite"
  url      = env("DATABASE_URL")  # Changed from "file:./dev.db"
}
```

### 4. Export SQLite Data
```bash
node export-sqlite-data.js
```
This creates `prisma-export.json` with all your data.

### 5. Create PostgreSQL Schema
```bash
npx prisma db push --force-reset
```

### 6. Import Data to PostgreSQL
```bash
node import-to-postgres.js
```

### 7. Regenerate Prisma Client
```bash
npx prisma generate
```

### 8. Verify Migration
```bash
npx prisma studio
```
Check all tables and data in the browser.

### 9. Restart Application
```bash
npm run dev
```

---

## 🔍 Troubleshooting

### PostgreSQL Not Running
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL (Windows)
# Services → PostgreSQL → Start
```

### Connection Refused
- Check PostgreSQL is running on port 5432
- Verify username/password in DATABASE_URL
- Check firewall settings

### Permission Denied
```sql
-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE aivonis TO aivonis_user;
ALTER DATABASE aivonis OWNER TO aivonis_user;
```

### Import Fails
- Ensure schema is pushed first: `npx prisma db push`
- Check foreign key constraints
- Verify data in `prisma-export.json`

---

## 📦 What Gets Migrated

✅ Users (with roles, plans, subscriptions)
✅ Agents (with all configurations)
✅ Agent Tools (transfer, booking, etc.)
✅ Documents (knowledge base)
✅ Calls (call history)
✅ Transcripts (conversation logs)
✅ Transactions (billing history)
✅ Active Agent settings
✅ System Settings (API keys, SMTP, etc.)
✅ Phone Numbers (Twilio numbers)

---

## 🎯 After Migration

1. **Keep Backup**: Don't delete `prisma-export.json` or `prisma/dev.db`
2. **Test Thoroughly**: Verify all features work
3. **Update Production**: Use same process for production when ready
4. **Performance**: PostgreSQL will be faster for larger datasets

---

## 🔄 Rollback (If Needed)

If something goes wrong:

1. Stop the application
2. Update `schema.prisma` back to SQLite:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.db"
   }
   ```
3. Run: `npx prisma generate`
4. Restart: `npm run dev`

Your original SQLite database is still intact!

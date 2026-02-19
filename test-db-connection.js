// Test PostgreSQL connection
const { Client } = require('pg');

// Read from .env
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

console.log('🔍 Testing PostgreSQL connection...\n');
console.log('Connection string:', connectionString.replace(/:[^:@]+@/, ':****@')); // Hide password
console.log('');

const client = new Client({
    connectionString: connectionString
});

client.connect()
    .then(() => {
        console.log('✅ Connection successful!');
        console.log('📊 Database info:');
        return client.query('SELECT version()');
    })
    .then((result) => {
        console.log('   PostgreSQL version:', result.rows[0].version.split(',')[0]);
        return client.query('SELECT current_database()');
    })
    .then((result) => {
        console.log('   Current database:', result.rows[0].current_database);
        return client.query('SELECT current_user');
    })
    .then((result) => {
        console.log('   Current user:', result.rows[0].current_user);
        console.log('\n✅ All checks passed! You can now run: npx prisma db push');
        client.end();
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Connection failed!');
        console.error('Error:', err.message);
        console.log('\n💡 Troubleshooting:');
        console.log('   1. Check your PostgreSQL password in .env file (line 32)');
        console.log('   2. Make sure PostgreSQL is running');
        console.log('   3. Verify the database "aivonis" exists in pgAdmin');
        console.log('   4. Check if the postgres user has the correct password');
        client.end();
        process.exit(1);
    });

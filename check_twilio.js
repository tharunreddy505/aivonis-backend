const fs = require('fs');
const path = require('path');
const twilio = require('twilio');

// Manually read .env
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/(^"|"$)/g, ''); // simple parse
            if (key && value && !key.startsWith('#')) {
                process.env[key] = value;
            }
        }
    });
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
    console.log('Twilio credentials missing in .env');
    process.exit(1);
}

const client = twilio(accountSid, authToken);

async function checkNumbers() {
    try {
        const numbers = await client.incomingPhoneNumbers.list({ limit: 20 });
        if (numbers.length === 0) {
            console.log('No phone numbers found on this account.');
            return;
        }

        console.log('Current Twilio Phone Numbers Configuration:');
        numbers.forEach(n => {
            console.log(`\nPhone Number: ${n.phoneNumber}`);
            console.log(`  Voice URL: ${n.voiceUrl}`);
            console.log(`  Voice Method: ${n.voiceMethod}`);
        });
    } catch (error) {
        console.error('Error fetching numbers:', error.message);
    }
}

checkNumbers();

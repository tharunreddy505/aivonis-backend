const fs = require('fs');
const path = require('path');
const twilio = require('twilio');

const NGROK_URL = 'https://branky-contemporaneously-meg.ngrok-free.dev';

// 1. Read .env
const envPath = path.resolve(__dirname, '.env');
let envContent = '';
if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
}

// 2. Load env vars
const envVars = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/(^"|"$)/g, '');
        if (key && !key.startsWith('#')) {
            envVars[key] = value;
        }
    }
});

const client = twilio(envVars.TWILIO_ACCOUNT_SID, envVars.TWILIO_AUTH_TOKEN);

async function update() {
    try {
        // 3. Update Twilio
        const numbers = await client.incomingPhoneNumbers.list({ limit: 1 });
        if (numbers.length > 0) {
            const sid = numbers[0].sid;
            await client.incomingPhoneNumbers(sid).update({
                voiceUrl: `${NGROK_URL}/api/voice`,
                voiceMethod: 'POST',
                statusCallback: `${NGROK_URL}/api/voice/status`,
                statusCallbackMethod: 'POST'
            });
            console.log(`Updated Twilio number ${numbers[0].phoneNumber}:`);
            console.log(`  Voice URL: ${NGROK_URL}/api/voice`);
            console.log(`  Status Callback: ${NGROK_URL}/api/voice/status`);
        } else {
            console.log('No Twilio numbers found.');
        }

        // 4. Update .env file
        let newEnvContent = envContent;

        // Update NEXT_PUBLIC_APP_URL
        if (newEnvContent.includes('NEXT_PUBLIC_APP_URL=')) {
            newEnvContent = newEnvContent.replace(/NEXT_PUBLIC_APP_URL=.*/, `NEXT_PUBLIC_APP_URL=${NGROK_URL}`);
        } else {
            newEnvContent += `\nNEXT_PUBLIC_APP_URL=${NGROK_URL}`;
        }

        fs.writeFileSync(envPath, newEnvContent);
        console.log('Updated .env file with new NEXT_PUBLIC_APP_URL.');

    } catch (error) {
        console.error('Error:', error);
    }
}

update();

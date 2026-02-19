const twilio = require('twilio');
const fs = require('fs');
const path = require('path');

// Load env vars manually
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

async function debugRecordings() {
    try {
        console.log('Fetching last 5 calls...');
        const calls = await client.calls.list({ limit: 5 });

        for (const call of calls) {
            console.log(`\nAnalyzing Call: ${call.sid}`);
            console.log(`Status: ${call.status}`);
            console.log(`Duration: ${call.duration}`);
            console.log(`Date: ${call.dateCreated}`);

            try {
                const recordings = await client.recordings.list({ callSid: call.sid });
                console.log(`Recordings Found: ${recordings.length}`);
                if (recordings.length > 0) {
                    recordings.forEach(rec => {
                        console.log(` - SID: ${rec.sid}`);
                        console.log(` - Status: ${rec.status}`);
                        console.log(` - Duration: ${rec.duration}`);
                        console.log(` - URI: ${rec.uri}`);
                    });
                }
            } catch (err) {
                console.error(`Failed to fetch recordings for call ${call.sid}:`, err.message);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

debugRecordings();

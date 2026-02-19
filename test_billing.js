
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBilling() {
    console.log('--- Starting Billing Test ---');

    // 1. Create/Get Test User
    const email = 'test_billing@example.com';
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                name: 'Billing Tester',
                password: 'hashedpassword',
                role: 'user',
                plan: 'STARTER',
                creditsBalance: 10.00, // Starts with $10
                usageMinutesUsed: 0
            }
        });
        console.log('Created Test User:', user.id);
    } else {
        // Reset for valid test
        user = await prisma.user.update({
            where: { email },
            data: { creditsBalance: 10.00, usageMinutesUsed: 0 }
        });
        console.log('Reset Test User:', user.id);
    }

    // 2. Create/Get Test Agent
    let agent = await prisma.agent.findFirst({ where: { userId: user.id } });
    if (!agent) {
        agent = await prisma.agent.create({
            data: {
                name: 'Billing Agent',
                prompt: 'Test Prompt',
                voice: 'alloy',
                gender: 'male',
                userId: user.id
            }
        });
        console.log('Created Test Agent:', agent.id);
    }

    // 3. Create Test Call
    const callSid = `CA${Date.now()}`; // Unique Fake ID
    const call = await prisma.call.create({
        data: {
            callSid,
            agentId: agent.id,
            startTime: new Date()
        }
    });
    console.log('Created Active Call:', callSid);

    // 4. Simulate Twilio Webhook (Call ends after 60 seconds)
    // We will call the DB function directly here to test logic (bypassing HTTP for simplicity first)
    // But importantly, we are testing the `updateCallStatus` logic we imported.

    // We can't import the function easily in a standalone script without TS setup, 
    // so we will essentially "Simulate" the HTTP call by using fetch against your running server?
    // Or simpler: We just use the logic directly here to verify DB behavior if we were to run the code.

    // Better approach: Let's use `fetch` to hit your running localhost API.

    try {
        const formData = new URLSearchParams();
        formData.append('CallSid', callSid);
        formData.append('CallStatus', 'completed');
        formData.append('CallDuration', '60'); // 1 Minute
        formData.append('RecordingUrl', 'http://example.com/rec.mp3');

        console.log('Sending Webhook to API...');
        const response = await fetch('http://localhost:3000/api/voice/status', {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.ok) {
            console.log('Webhook Success (200 OK)');
        } else {
            console.error('Webhook Failed:', response.status);
        }

        // 5. Verify Results
        const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
        const updatedCall = await prisma.call.findUnique({ where: { callSid } });
        const transaction = await prisma.transaction.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        console.log('\n--- Verification ---');
        console.log(`Original Balance: $10.00`);
        console.log(`New Balance:      $${updatedUser.creditsBalance.toFixed(2)}`);
        console.log(`Expected Cost:    $0.25 (Starter Rate)`);

        if (updatedUser.creditsBalance === 9.75) {
            console.log('✅ Balance Deduction Correct!');
        } else {
            console.log('❌ Balance Deduction Failed.');
        }

        if (updatedCall.cost === 0.25 && updatedCall.duration === 60) {
            console.log('✅ Call Record Updated Correctly!');
        } else {
            console.log('❌ Call Record Update Failed.');
        }

        if (transaction && transaction.amount === -0.25) {
            console.log('✅ Transaction Log Exists!');
        } else {
            console.log('❌ Transaction Log Missing.');
        }

    } catch (e) {
        console.error('Test Error:', e);
    }
}

testBilling()
    .catch(e => {
        throw e
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

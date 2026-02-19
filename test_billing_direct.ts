
import { PrismaClient } from '@prisma/client';
import { updateCallStatus } from './src/lib/db';

const prisma = new PrismaClient();

async function testBilling() {
    console.log('--- Starting Billing Test (Direct Logic) ---');

    // 1. Create/Get Test User
    const email = 'test_billing_direct@example.com';
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                name: 'Billing Tester Direct',
                password: 'hashedpassword',
                role: 'user',
                plan: 'STARTER',
                creditsBalance: 10.00, // Starts with $10
                usageMinutesUsed: 0
            }
        });
    } else {
        user = await prisma.user.update({
            where: { email },
            data: { creditsBalance: 10.00, usageMinutesUsed: 0 }
        });
    }

    // 2. Create/Get Test Agent
    let agent = await prisma.agent.findFirst({ where: { userId: user.id } });
    if (!agent) {
        agent = await prisma.agent.create({
            data: {
                name: 'Billing Agent Direct',
                prompt: 'Test Prompt',
                voice: 'alloy',
                gender: 'male',
                userId: user.id
            }
        });
    }

    // 3. Create Test Call
    const callSid = `CA${Date.now()}`;
    await prisma.call.create({
        data: {
            callSid,
            agentId: agent.id,
            startTime: new Date()
        }
    });
    console.log('Created Call:', callSid);

    // 4. Run the Logic Directly (Simulating API Route)
    console.log('Executing updateCallStatus logic...');
    await updateCallStatus(callSid, 60, 'completed', 'http://test.com/rec.mp3');

    // 5. Verify Results
    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    const updatedCall = await prisma.call.findUnique({ where: { callSid } });
    const transaction = await prisma.transaction.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
    });

    console.log('\n--- Verification ---');
    console.log(`Original Balance: $10.00`);
    console.log(`New Balance:      $${updatedUser?.creditsBalance.toFixed(2)}`);

    if (updatedUser?.creditsBalance === 9.75) {
        console.log('✅ Balance Deduction Correct! ($10.00 -> $9.75)');
    } else {
        console.log('❌ Balance Deduction Failed.');
    }

    if (updatedCall?.cost === 0.25) {
        console.log('✅ Call Cost Recorded Correctly! ($0.25)');
    } else {
        console.log('❌ Call Cost Failed.');
    }

    if (transaction?.amount === -0.25) {
        console.log('✅ Transaction Logged Correctly!');
    } else {
        console.log('❌ Transaction Missing.');
    }
}

testBilling()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect()
    })

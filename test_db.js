const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function test() {
    console.log('--- Diagnostic Start ---');
    try {
        console.log('Testing Database connection...');
        const userCount = await prisma.user.count();
        console.log(`Successfully connected. User count: ${userCount}`);

        console.log('Testing bcrypt hashing...');
        const hash = await bcrypt.hash('test', 10);
        console.log('Bcrypt hash successful:', hash.substring(0, 10) + '...');

        console.log('Testing Agent creation...');
        const testAgent = await prisma.agent.create({
            data: {
                name: 'Test Agent ' + Date.now(),
                prompt: 'Test prompt',
                voice: 'shimmer',
                gender: 'female'
            }
        });
        console.log('Agent created successfully. ID:', testAgent.id);

        // Clean up
        await prisma.agent.delete({ where: { id: testAgent.id } });
        console.log('Cleanup successful.');

    } catch (err) {
        console.error('DIAGNOSTIC FAILED:', err);
    } finally {
        await prisma.$disconnect();
        console.log('--- Diagnostic End ---');
    }
}

test();

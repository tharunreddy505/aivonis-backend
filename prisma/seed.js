const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Seed started...');

    // Create Agents
    const sarah = await prisma.agent.upsert({
        where: { id: '1' },
        update: {
            name: 'Sarah (Customer Support)',
            prompt: 'You are a helpful customer support assistant named Sarah. Be polite, professional, and concise.',
            voice: 'shimmer',
            gender: 'female',
        },
        create: {
            id: '1',
            name: 'Sarah (Customer Support)',
            prompt: 'You are a helpful customer support assistant named Sarah. Be polite, professional, and concise.',
            voice: 'shimmer',
            gender: 'female',
        },
    });

    const james = await prisma.agent.upsert({
        where: { id: '2' },
        update: {
            name: 'James (Sales Agent)',
            prompt: 'You are an energetic sales agent named James. Your goal is to qualify leads and schedule follow-up calls.',
            voice: 'onyx',
            gender: 'male',
        },
        create: {
            id: '2',
            name: 'James (Sales Agent)',
            prompt: 'You are an energetic sales agent named James. Your goal is to qualify leads and schedule follow-up calls.',
            voice: 'onyx',
            gender: 'male',
        },
    });

    console.log('Created/Updated agents: Sarah and James');

    // Create Users - UPSERT BY ID TO HANDLE EMAIL CHANGES
    const adminPassword = await bcrypt.hash('admin123', 10);

    // Check if user exists by email to handle potential conflict if ID is different
    // But since we are forcing ID 1 for admin, let's stick to ID upsert.
    // If ID 1 has different email, it updates.
    // If ID 1 doesn't exist, it creates.
    // Ensure email is unique: If another user has this email but different ID, we might fail.
    // Let's delete by email first just in case to avoid unique constraint on email if we change IDs? 
    // No, let's assume IDs are stable for seed users.

    await prisma.user.upsert({
        where: { id: '1' },
        update: {
            email: 'admin@aivonis.ai',
            password: adminPassword,
            name: 'Admin User',
            role: 'admin'
        },
        create: {
            id: '1',
            email: 'admin@aivonis.ai',
            password: adminPassword,
            name: 'Admin User',
            role: 'admin',
        },
    });

    const staffPassword = await bcrypt.hash('staff123', 10);
    await prisma.user.upsert({
        where: { id: '2' },
        update: {
            email: 'staff@aivonis.ai',
            password: staffPassword,
            name: 'Staff User',
            role: 'staff',
            assignedAgentId: '2',
        },
        create: {
            id: '2',
            email: 'staff@aivonis.ai',
            password: staffPassword,
            name: 'Staff User',
            role: 'staff',
            assignedAgentId: '2',
        },
    });

    console.log('Created/Updated users: admin and staff');

    // Set Active Agent
    // Need to handle if ActiveAgent table is empty or id is not 1
    // Prisma upset requires unique where. id is @id default(1).
    // Let's find first or create.
    const activeAgent = await prisma.activeAgent.findFirst();
    if (activeAgent) {
        await prisma.activeAgent.update({
            where: { id: activeAgent.id },
            data: { agentId: '1' }
        });
    } else {
        await prisma.activeAgent.create({
            data: { agentId: '1' }
        });
    }

    console.log('Seed finished successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

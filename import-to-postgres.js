const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importData() {
    console.log('📥 Importing data to PostgreSQL...\n');

    try {
        // Read exported data
        const rawData = fs.readFileSync('prisma-export.json', 'utf8');
        const data = JSON.parse(rawData);

        console.log('🔄 Starting import process...\n');

        // Import in correct order (respecting foreign key constraints)

        // 1. Users (no dependencies)
        console.log('Importing Users...');
        for (const user of data.users) {
            await prisma.user.upsert({
                where: { id: user.id },
                update: user,
                create: user
            });
        }
        console.log(`✓ Imported ${data.users.length} users\n`);

        // 2. Agents (depends on Users)
        console.log('Importing Agents...');
        for (const agent of data.agents) {
            await prisma.agent.upsert({
                where: { id: agent.id },
                update: agent,
                create: agent
            });
        }
        console.log(`✓ Imported ${data.agents.length} agents\n`);

        // 3. Agent Tools (depends on Agents)
        console.log('Importing Agent Tools...');
        for (const tool of data.agentTools) {
            await prisma.agentTool.upsert({
                where: { id: tool.id },
                update: tool,
                create: tool
            });
        }
        console.log(`✓ Imported ${data.agentTools.length} agent tools\n`);

        // 4. Documents (no dependencies)
        console.log('Importing Documents...');
        for (const doc of data.documents) {
            await prisma.document.upsert({
                where: { id: doc.id },
                update: doc,
                create: doc
            });
        }
        console.log(`✓ Imported ${data.documents.length} documents\n`);

        // 5. Calls (depends on Agents)
        console.log('Importing Calls...');
        for (const call of data.calls) {
            await prisma.call.upsert({
                where: { id: call.id },
                update: call,
                create: call
            });
        }
        console.log(`✓ Imported ${data.calls.length} calls\n`);

        // 6. Transcripts (depends on Calls)
        console.log('Importing Transcripts...');
        for (const transcript of data.transcripts) {
            await prisma.transcript.upsert({
                where: { id: transcript.id },
                update: transcript,
                create: transcript
            });
        }
        console.log(`✓ Imported ${data.transcripts.length} transcripts\n`);

        // 7. Transactions (depends on Users)
        console.log('Importing Transactions...');
        for (const transaction of data.transactions) {
            await prisma.transaction.upsert({
                where: { id: transaction.id },
                update: transaction,
                create: transaction
            });
        }
        console.log(`✓ Imported ${data.transactions.length} transactions\n`);

        // 8. Active Agent
        console.log('Importing Active Agent...');
        for (const active of data.activeAgent) {
            await prisma.activeAgent.upsert({
                where: { id: active.id },
                update: active,
                create: active
            });
        }
        console.log(`✓ Imported ${data.activeAgent.length} active agent records\n`);

        // 9. Settings
        console.log('Importing Settings...');
        for (const setting of data.settings) {
            await prisma.settings.upsert({
                where: { id: setting.id },
                update: setting,
                create: setting
            });
        }
        console.log(`✓ Imported ${data.settings.length} settings\n`);

        // 10. Phone Numbers (depends on Agents)
        console.log('Importing Phone Numbers...');
        for (const phone of data.phoneNumbers) {
            await prisma.phoneNumber.upsert({
                where: { id: phone.id },
                update: phone,
                create: phone
            });
        }
        console.log(`✓ Imported ${data.phoneNumbers.length} phone numbers\n`);

        console.log('✅ Import completed successfully!');
        console.log(`📅 Original export date: ${data.exportedAt}`);

    } catch (error) {
        console.error('❌ Error importing data:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

importData();

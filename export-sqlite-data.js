const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
    console.log('📦 Exporting data from SQLite...\n');

    try {
        // Export all tables
        const users = await prisma.user.findMany();
        const agents = await prisma.agent.findMany();
        const agentTools = await prisma.agentTool.findMany();
        const documents = await prisma.document.findMany();
        const calls = await prisma.call.findMany();
        const transcripts = await prisma.transcript.findMany();
        const transactions = await prisma.transaction.findMany();
        const activeAgent = await prisma.activeAgent.findMany();
        const settings = await prisma.settings.findMany();
        const phoneNumbers = await prisma.phoneNumber.findMany();

        const exportData = {
            users,
            agents,
            agentTools,
            documents,
            calls,
            transcripts,
            transactions,
            activeAgent,
            settings,
            phoneNumbers,
            exportedAt: new Date().toISOString()
        };

        // Write to JSON file
        fs.writeFileSync('prisma-export.json', JSON.stringify(exportData, null, 2));

        console.log('✅ Export completed successfully!\n');
        console.log('📊 Export Summary:');
        console.log(`   Users: ${users.length}`);
        console.log(`   Agents: ${agents.length}`);
        console.log(`   Agent Tools: ${agentTools.length}`);
        console.log(`   Documents: ${documents.length}`);
        console.log(`   Calls: ${calls.length}`);
        console.log(`   Transcripts: ${transcripts.length}`);
        console.log(`   Transactions: ${transactions.length}`);
        console.log(`   Active Agents: ${activeAgent.length}`);
        console.log(`   Settings: ${settings.length}`);
        console.log(`   Phone Numbers: ${phoneNumbers.length}`);
        console.log(`\n💾 Data saved to: prisma-export.json`);

    } catch (error) {
        console.error('❌ Error exporting data:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

exportData();

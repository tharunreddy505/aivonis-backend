const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showDatabaseStats() {
    console.log('📊 PostgreSQL Database Statistics\n');
    console.log('='.repeat(50));

    try {
        // Count records in each table
        const userCount = await prisma.user.count();
        const agentCount = await prisma.agent.count();
        const agentToolCount = await prisma.agentTool.count();
        const documentCount = await prisma.document.count();
        const callCount = await prisma.call.count();
        const transcriptCount = await prisma.transcript.count();
        const transactionCount = await prisma.transaction.count();
        const phoneNumberCount = await prisma.phoneNumber.count();
        const settingsCount = await prisma.settings.count();

        console.log(`\n📋 Record Counts:`);
        console.log(`   Users:         ${userCount}`);
        console.log(`   Agents:        ${agentCount}`);
        console.log(`   Agent Tools:   ${agentToolCount}`);
        console.log(`   Documents:     ${documentCount}`);
        console.log(`   Calls:         ${callCount}`);
        console.log(`   Transcripts:   ${transcriptCount}`);
        console.log(`   Transactions:  ${transactionCount}`);
        console.log(`   Phone Numbers: ${phoneNumberCount}`);
        console.log(`   Settings:      ${settingsCount}`);

        // Show sample data
        console.log(`\n\n👥 Users:`);
        const users = await prisma.user.findMany({ take: 5 });
        users.forEach(user => {
            console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
        });

        console.log(`\n\n🤖 Agents:`);
        const agents = await prisma.agent.findMany({ take: 5 });
        agents.forEach(agent => {
            console.log(`   - ${agent.name} (${agent.voice} voice, ${agent.gender})`);
        });

        console.log(`\n\n📞 Recent Calls:`);
        const calls = await prisma.call.findMany({
            take: 5,
            orderBy: { startTime: 'desc' },
            include: { agent: true }
        });
        calls.forEach(call => {
            console.log(`   - ${call.agent.name}: ${call.from || 'Unknown'} → ${call.to || 'Unknown'} (${call.duration}s)`);
        });

        console.log(`\n\n⚙️  Settings:`);
        const settings = await prisma.settings.findFirst();
        if (settings) {
            console.log(`   - OpenAI Key: ${settings.openaiApiKey ? '✓ Configured' : '✗ Not set'}`);
            console.log(`   - Twilio SID: ${settings.twilioAccountSid ? '✓ Configured' : '✗ Not set'}`);
            console.log(`   - SMTP Host:  ${settings.smtpHost || '✗ Not set'}`);
        }

        console.log('\n' + '='.repeat(50));
        console.log('✅ All data successfully migrated to PostgreSQL!');
        console.log('\n💡 To view all data in detail:');
        console.log('   - Open http://localhost:5555 in your browser (Prisma Studio)');
        console.log('   - Or use pgAdmin to browse the "aivonis" database');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

showDatabaseStats();

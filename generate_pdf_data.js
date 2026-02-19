
const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function generatePDF() {
    const doc = new PDFDocument();
    const filePath = path.join(__dirname, 'Project_Data.pdf');
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(25).text('AIvonis Project Data', { align: 'center' });
    doc.moveDown();

    try {
        // Users
        const users = await prisma.user.findMany({
            include: { agents: true, transactions: true }
        });
        doc.fontSize(18).text('Users', { underline: true });
        users.forEach(user => {
            doc.fontSize(12).text(`Name: ${user.name}`);
            doc.text(`Email: ${user.email}`);
            doc.text(`Role: ${user.role}`);
            doc.text(`Plan: ${user.plan}`);
            doc.text(`Credits: ${user.creditsBalance}`);
            doc.text(`Agents Count: ${user.agents.length}`);
            doc.moveDown(0.5);
        });
        doc.addPage();

        // Agents
        const agents = await prisma.agent.findMany({
            include: { calls: true }
        });
        doc.fontSize(18).text('Agents', { underline: true });
        agents.forEach(agent => {
            doc.fontSize(12).text(`Name: ${agent.name}`);
            doc.text(`Prompt: ${agent.prompt.substring(0, 100)}...`);
            doc.text(`Voice: ${agent.voice}`);
            doc.text(`Calls Count: ${agent.calls.length}`);
            doc.moveDown(0.5);
        });
        doc.addPage();

        // Calls
        const calls = await prisma.call.findMany({
            take: 50, // Limit to 50 for readability in this example
            orderBy: { startTime: 'desc' }
        });
        doc.fontSize(18).text('Recent Calls (Last 50)', { underline: true });
        calls.forEach(call => {
            doc.fontSize(12).text(`SID: ${call.callSid}`);
            doc.text(`From: ${call.from || 'N/A'}`);
            doc.text(`To: ${call.to || 'N/A'}`);
            doc.text(`Duration: ${call.duration}s`);
            doc.text(`Status: ${call.status}`);
            doc.text(`Cost: $${call.cost}`);
            doc.moveDown(0.5);
        });

        console.log(`PDF generated successfully at ${filePath}`);

    } catch (error) {
        console.error('Error fetching data:', error);
        doc.text('Error fetching data from database.');
    } finally {
        doc.end();
        await prisma.$disconnect();
    }
}

generatePDF();

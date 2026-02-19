const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@aivonis.ai';
    const password = 'admin123';

    console.log(`Checking user: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.log('User NOT FOUND in database.');
        return;
    }

    console.log('User found:', {
        id: user.id,
        email: user.email,
        role: user.role,
        passwordHash: user.password.substring(0, 10) + '...'
    });

    const match = await bcrypt.compare(password, user.password);

    if (match) {
        console.log('Password CORRECT.');
    } else {
        console.log('Password INCORRECT.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());

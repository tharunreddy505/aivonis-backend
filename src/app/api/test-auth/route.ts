import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function GET() {
    try {
        console.log('Test Auth API called');
        const email = 'admin@aivonis.ai';
        const password = 'admin123';

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' });
        }

        const match = await bcrypt.compare(password, user.password);

        return NextResponse.json({
            success: true,
            user: {
                email: user.email,
                id: user.id
            },
            passwordMatch: match
        });
    } catch (error: any) {
        console.error('Test Auth Error:', error);
        return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
    }
}

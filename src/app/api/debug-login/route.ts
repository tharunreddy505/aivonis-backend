import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/users';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = body;

        console.log(`[Debug] Checking login for: ${email}`);

        // 1. Check User
        const user = await getUserByEmail(email);
        if (!user) {
            return NextResponse.json({
                success: false,
                step: 'find_user',
                message: 'User not found in DB',
                email
            });
        }

        console.log(`[Debug] User found: ${user.id}, Role: ${user.role}`);
        console.log(`[Debug] Stored hash length: ${user.password.length}`);

        // 2. Check Password
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            // Generate a new hash to see what it should look like (for debugging)
            const newHash = await bcrypt.hash(password, 10);
            return NextResponse.json({
                success: false,
                step: 'verify_password',
                message: 'Password mismatch',
                debug: {
                    storedHash: user.password.substring(0, 10) + '...',
                    newGeneratedHash: newHash.substring(0, 10) + '...'
                }
            });
        }

        return NextResponse.json({ success: true, message: 'Login logic verified successfully', user: { id: user.id, email: user.email } });

    } catch (error: any) {
        console.error('[Debug] Error:', error);
        return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
    }
}

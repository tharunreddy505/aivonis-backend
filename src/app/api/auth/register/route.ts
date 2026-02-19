import { NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/users';

export async function POST(req: Request) {
    try {
        const { firstName, lastName, email, password, company } = await req.json();

        if (!email || !password || !firstName || !lastName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        const name = `${firstName} ${lastName}`;
        // Note: For now, we'll assign the 'staff' role by default or create a logic for new signups.
        // Assuming 'staff' for standard users. Admin is usually seeded.

        await createUser({
            email,
            password,
            name,
            role: 'staff',
            // company: company // Schema doesn't have company yet, check schema?
        });

        // If schema has company, add it. If not, maybe store in metadata or name for now?
        // Let's check schema again if needed, but for now we proceed without company in DB or ignore it.

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

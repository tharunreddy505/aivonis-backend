import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Email not registered' },
                { status: 404 }
            );
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

        // Save token to database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });

        // In a production environment, you would send an email here
        // For now, we'll just log the reset link
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
        const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

        console.log('='.repeat(80));
        console.log('PASSWORD RESET REQUEST');
        console.log('='.repeat(80));
        console.log('User:', user.email);
        console.log('Reset URL:', resetUrl);
        console.log('Token expires:', resetTokenExpiry);
        console.log('='.repeat(80));

        // TODO: Send email with reset link
        // await sendPasswordResetEmail(user.email, resetUrl);

        return NextResponse.json(
            {
                message: 'If an account exists with this email, a reset link has been sent.',
                // In development, include the reset URL
                ...(process.env.NODE_ENV === 'development' && { resetUrl })
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { error: 'An error occurred. Please try again.' },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSettings } from '@/lib/config';
import { auth } from '@/lib/auth';

export async function GET() {
    try {
        const session = await auth();
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const settings = await getSettings();
        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { openaiApiKey, twilioAccountSid, twilioAuthToken } = body;

        const settings = await prisma.settings.upsert({
            where: { id: 1 },
            update: {
                openaiApiKey,
                twilioAccountSid,
                twilioAuthToken,
                smtpHost: body.smtpHost,
                smtpPort: body.smtpPort ? parseInt(body.smtpPort) : undefined,
                smtpUser: body.smtpUser,
                smtpPassword: body.smtpPassword,
                smtpSecure: body.smtpSecure,
            },
            create: {
                id: 1,
                openaiApiKey,
                twilioAccountSid,
                twilioAuthToken,
                smtpHost: body.smtpHost,
                smtpPort: body.smtpPort ? parseInt(body.smtpPort) : undefined,
                smtpUser: body.smtpUser,
                smtpPassword: body.smtpPassword,
                smtpSecure: body.smtpSecure,
            },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error saving settings:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}

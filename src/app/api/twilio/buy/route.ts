import { NextResponse } from 'next/server';
import { buyPhoneNumber } from '@/lib/twilio';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phoneNumber, agentId } = body;

        if (!phoneNumber || !agentId) {
            return NextResponse.json({ error: 'PhoneNumber and AgentId are required' }, { status: 400 });
        }

        // Determine base URL for webhooks
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const host = request.headers.get('host');
        const baseUrl = `${protocol}://${host}`;

        // Check if agent already has a number
        const existingNumber = await prisma.phoneNumber.findUnique({
            where: { agentId }
        });

        if (existingNumber) {
            // Option: Detach existing number or Error. 
            // For now, let's just detach it so the user can assign a new one.
            // Or maybe we should prompt? But for "Buy" action, usually implies replace.
            await prisma.phoneNumber.update({
                where: { id: existingNumber.id },
                data: { agentId: null }
            });
        }

        const purchasedNumber = await buyPhoneNumber(phoneNumber, agentId, baseUrl);

        // Save to DB
        const savedNumber = await prisma.phoneNumber.create({
            data: {
                phoneNumber: purchasedNumber.phoneNumber,
                sid: purchasedNumber.sid,
                friendlyName: purchasedNumber.friendlyName,
                countryCode: 'US', // Default or extract
                agentId: agentId
            }
        });

        return NextResponse.json(savedNumber);

    } catch (error: any) {
        console.error('Buy number error:', error);
        return NextResponse.json({ error: error.message || 'Failed to buy number' }, { status: 500 });
    }
}

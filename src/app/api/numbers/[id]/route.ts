import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { agentId } = body;

        // If assigning to an agent
        if (agentId) {
            // Check if this agent is already assigned to another number? 
            // The requirement is 1-to-1.
            // If the agent already has a number, we should probably detach it from the old number first.
            const existingNumber = await prisma.phoneNumber.findUnique({
                where: { agentId }
            });

            if (existingNumber && existingNumber.id !== id) {
                await prisma.phoneNumber.update({
                    where: { id: existingNumber.id },
                    data: { agentId: null }
                });
            }
        }

        const updatedNumber = await prisma.phoneNumber.update({
            where: { id },
            data: { agentId: agentId || null }
        });

        return NextResponse.json(updatedNumber);

    } catch (error) {
        console.error('Error updating number:', error);
        return NextResponse.json({ error: 'Failed to update number' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // In a real app, we would release the number from Twilio here too
        // const { getTwilioClient } = await import('@/lib/twilio');
        // ... release logic ...

        await prisma.phoneNumber.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting number:', error);
        return NextResponse.json({ error: 'Failed to delete number' }, { status: 500 });
    }
}

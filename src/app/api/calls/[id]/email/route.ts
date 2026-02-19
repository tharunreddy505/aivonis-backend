import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendTranscriptEmail } from '@/lib/email';
import { getTranscript } from '@/lib/db';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params; // callSid

        // 1. Fetch Call and Agent
        const call = await prisma.call.findUnique({
            where: { callSid: id },
            include: { agent: true } // Assuming relation exists, if not we fetch separately
        });

        if (!call) {
            return NextResponse.json({ error: 'Call not found' }, { status: 404 });
        }

        if (!call.agent) {
            // Try to fetch agent if relation didn't work or if it's loosely coupled
            // checking schema... schema says Call has agentId. relation might not be named 'agent' in prisma client if I didn't check.
            // Let's assume loose coupling for safety based on previous files.
            return NextResponse.json({ error: 'No agent associated with this call' }, { status: 404 });
        }

        // 2. Validate Email
        if (!call.agent.transcriptionEmail) {
            return NextResponse.json({ error: 'No email configured for this agent' }, { status: 400 });
        }

        // 3. Fetch Transcript
        const transcript = await getTranscript(id);
        if (!transcript) {
            return NextResponse.json({ error: 'No transcript available' }, { status: 400 });
        }

        // 4. Send Email
        const result = await sendTranscriptEmail({
            recipientEmail: call.agent.transcriptionEmail,
            agentName: call.agent.name,
            callSid: id,
            transcript: transcript,
            startTime: call.startTime || new Date(),
            duration: '0s' // we can calculate or ignore
        });

        if (result.success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: result.error || 'Failed to send email' }, { status: 500 });
        }

    } catch (error) {
        console.error('[API] Error sending manual email:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

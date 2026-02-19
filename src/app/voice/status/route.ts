import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const formData = await req.formData();
    const callStatus = formData.get('CallStatus') as string;
    const callSid = formData.get('CallSid') as string;

    if (callStatus === 'completed' && callSid) {
        try {
            const { getCallAgent, getTranscript } = await import('@/lib/db');
            const { getAgentById } = await import('@/lib/agents');
            const { sendTranscriptEmail } = await import('@/lib/email');

            const agentId = await getCallAgent(callSid);
            if (agentId) {
                const agent = await getAgentById(agentId);
                if (agent && agent.sendEmailAfterCall && agent.transcriptionEmail) {
                    // Wait for final transcripts
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    const transcript = await getTranscript(callSid);
                    const callerNumber = formData.get('From') as string || 'Unknown';

                    if (transcript) {
                        await sendTranscriptEmail({
                            recipientEmail: agent.transcriptionEmail,
                            agentName: agent.name,
                            callSid: callSid as string,
                            transcript,
                            startTime: new Date(),
                            callerNumber
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    console.log(`Call ${callSid} status changed to: ${callStatus}`);

    return new NextResponse('OK', { status: 200 });
}

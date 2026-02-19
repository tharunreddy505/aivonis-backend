import { NextResponse } from 'next/server';
import { updateCallStatus } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const callSid = formData.get('CallSid') as string;
        const callStatus = formData.get('CallStatus') as string;
        const callDuration = formData.get('CallDuration') as string;
        const recordingUrl = formData.get('RecordingUrl') as string;

        console.log(`[Voice Status] Call ${callSid} ended. Status: ${callStatus}. Duration: ${callDuration}`);

        if (callSid && callDuration) {
            const duration = parseInt(callDuration, 10);
            await updateCallStatus(callSid, duration, callStatus, recordingUrl);
        }

        return new NextResponse(null, { status: 200 });
    } catch (error) {
        console.error('[Voice Status] Error processing callback:', error);
        return new NextResponse(null, { status: 500 });
    }
}

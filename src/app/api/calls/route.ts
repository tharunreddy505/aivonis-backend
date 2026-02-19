import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { auth } from '@/lib/auth';
import { getSettings } from '@/lib/config';
import { getAgents } from '@/lib/agents';
import { getTranscript, getCallAgent } from '@/lib/db';

export async function GET() {
    try {
        // Get user session for filtering
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userAgentId = session.user.assignedAgentId;
        const isAdmin = session.user.role === 'admin';

        const settings = await getSettings();
        const accountSid = settings.twilioAccountSid;
        const authToken = settings.twilioAuthToken;

        if (!accountSid || !authToken) {
            console.error('[API] Twilio credentials missing');
            // Return empty array instead of error to avoid blocking UI, or return specific error
            // But frontend expects array usually? No, it expects array for data.
            // If we return 500, frontend shows error.
            return NextResponse.json({ error: 'Twilio credentials missing' }, { status: 500 });
        }

        const client = twilio(accountSid, authToken);

        // Parallel fetch for simplified data
        // Get allowed agents for this user (Admin gets all, User gets owned + assigned)
        const userId = session.user.id;

        // Critical Security Check: If not admin, we MUST have a userId to filter by.
        // If userId is missing, we must NOT call getAgents(undefined) as it returns all agents.
        if (!isAdmin && !userId) {
            console.error('[Calls API] detailed security alert: Non-admin user has no ID');
            return NextResponse.json([]);
        }

        const allowedAgents = await getAgents(
            isAdmin ? undefined : userId,
            isAdmin ? undefined : userAgentId
        );

        const allowedAgentIds = new Set(allowedAgents.map(a => a.id));

        const [calls] = await Promise.all([
            client.calls.list({ limit: 50 })
        ]);

        const formattedCalls = await Promise.all(calls.map(async (call: any) => {
            try {
                // Fetch additional data per call safely
                const transcriptData = await getTranscript(call.sid).catch(() => '');
                const callAgentId = await getCallAgent(call.sid).catch(() => undefined);

                // If not admin, check if call belongs to an allowed agent
                if (!isAdmin && (!callAgentId || !allowedAgentIds.has(callAgentId))) {
                    return null; // Skip this call
                }

                let recordingUrl = null;
                try {
                    const recordings = await client.recordings.list({ callSid: call.sid, limit: 1 });
                    if (recordings.length > 0) {
                        // Use local proxy to handle authentication
                        recordingUrl = `/api/recording?sid=${recordings[0].sid}`;
                    }
                } catch (err) {
                    console.error(`[Calls API] Failed to fetch recording for ${call.sid}`, err);
                }

                const agentRecord = allowedAgents.find((a: any) => a.id === callAgentId);

                return {
                    id: call.sid,
                    type: call.direction === 'inbound' ? 'incoming' : 'outgoing',
                    caller: call.from,
                    agent: agentRecord ? agentRecord.name.split(' ')[0] : (call.to || 'Unknown'),
                    agentId: callAgentId,
                    duration: call.duration ? `${call.duration}s` : '0s',
                    date: call.dateCreated.toLocaleString(),
                    status: call.status,
                    transcript: transcriptData || 'No transcript available',
                    recordingUrl
                };
            } catch (err) {
                console.error(`[API] Error processing call ${call.sid}:`, err);
                return null;
            }
        }));

        // Filter out nulls (skipped calls)
        const filteredCalls = formattedCalls.filter(Boolean);

        return NextResponse.json(filteredCalls);

    } catch (error: any) {
        console.error('[API] Error fetching Twilio calls:', error);
        return NextResponse.json({ error: 'Failed to fetch calls', details: error.message }, { status: 500 });
    }
}

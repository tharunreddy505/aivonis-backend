import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { getAgents } from '@/lib/agents';
import { prisma } from '@/lib/db';
import { getSettings } from '@/lib/config';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = session.user.role === 'admin';
        const userId = session.user.id;
        const assignedAgentId = session.user.assignedAgentId;

        // Get allowed agents
        const agents = await getAgents(
            isAdmin ? undefined : userId,
            isAdmin ? undefined : assignedAgentId
        );

        const activeAgentsCount = agents.length;
        const allowedAgentIds = new Set(agents.map(a => a.id));

        const settings = await getSettings();
        const accountSid = settings.twilioAccountSid;
        const authToken = settings.twilioAuthToken;

        if (!accountSid || !authToken) {
            return NextResponse.json({ error: 'Twilio credentials missing' }, { status: 500 });
        }

        const client = twilio(accountSid, authToken);

        // Fetch calls (limit to last 100 for stats)
        // We have to filter them manually since Twilio doesn't support our agent metadata in list filters easily
        const calls = await client.calls.list({ limit: 100 });

        let filteredCalls: any[] = [];

        if (isAdmin) {
            filteredCalls = calls;
        } else {
            // Filter calls by matching agent ID from DB
            // We need to look up agentId for each call
            // Using Promise.all for speed
            const callPromises = calls.map(async (call) => {
                const dbCall = await prisma.call.findUnique({
                    where: { callSid: call.sid },
                    select: { agentId: true }
                });

                if (dbCall && dbCall.agentId && allowedAgentIds.has(dbCall.agentId)) {
                    return call;
                }
                return null;
            });

            const results = await Promise.all(callPromises);
            filteredCalls = results.filter(c => c !== null);
        }

        // 1. Total Calls
        const totalCalls = filteredCalls.length;

        // 2. Minutes Used
        const totalDurationSeconds = filteredCalls.reduce((acc: number, call: any) => acc + (parseInt(call.duration) || 0), 0);
        const totalMinutes = Math.round(totalDurationSeconds / 60);

        // 4. Appointments
        // Count from transcripts linked to allowed calls
        // Efficient query:
        const whereTranscript: any = {};
        if (!isAdmin) {
            const orConditions: any[] = [];
            if (userId) orConditions.push({ agent: { userId: userId } });
            if (assignedAgentId) orConditions.push({ agentId: assignedAgentId });

            // If non-admin has no agents, they see no appointments
            if (orConditions.length === 0) {
                whereTranscript.callSid = 'NO_MATCH';
            } else {
                whereTranscript.call = {
                    agent: {
                        OR: orConditions
                    }
                };
            }
        }

        const appointmentTranscripts = await prisma.transcript.findMany({
            distinct: ['callSid'],
            where: {
                ...whereTranscript,
                content: {
                    contains: 'appointment'
                }
            }
        });

        const appointmentCount = appointmentTranscripts.length;

        return NextResponse.json({
            totalCalls: totalCalls.toString(),
            totalMinutes: `${totalMinutes}`,
            activeAgents: activeAgentsCount.toString(),
            appointments: appointmentCount.toString()
        });

    } catch (error) {
        console.error('Error calculating stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}

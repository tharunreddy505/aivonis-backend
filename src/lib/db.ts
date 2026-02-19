import prismaClient from './prisma';
export const prisma = prismaClient;

export async function setActiveAgentId(id: string) {
    try {
        await prisma.activeAgent.upsert({
            where: { id: 1 },
            update: { agentId: id },
            create: { id: 1, agentId: id }
        });
        console.log(`[DB] Active agent saved to DB: ${id}`);
    } catch (error) {
        console.error('[DB] Error setting active agent:', error);
    }
}

export async function getActiveAgentId(): Promise<string> {
    try {
        const record = await prisma.activeAgent.findUnique({
            where: { id: 1 }
        });
        return record?.agentId || '1'; // Default to '1' if not set
    } catch (error) {
        console.error('[DB] Error getting active agent:', error);
        return '1';
    }
}

export async function addTranscript(callSid: string, role: string, content: string) {
    try {
        // Ensure the call exists first (setCallAgent should have created it)
        // If not, we don't have an agentId, which is problematic for our schema
        // But for resilience, we'll try to find it
        const call = await prisma.call.findUnique({
            where: { callSid }
        });

        if (!call) {
            console.warn(`[DB] Call ${callSid} not found when adding transcript. This might happen if status callback arrives after transcript.`);
            return;
        }

        await prisma.transcript.create({
            data: {
                callSid,
                role,
                content
            }
        });
        console.log(`[DB] Added transcript entry for ${callSid}`);
    } catch (error) {
        console.error(`[DB] Error adding transcript for ${callSid}:`, error);
    }
}

export async function getTranscript(callSid: string): Promise<string> {
    try {
        const transcripts = await prisma.transcript.findMany({
            where: { callSid },
            orderBy: { timestamp: 'asc' }
        });
        if (transcripts.length === 0) return '';
        return transcripts
            .map(t => `${t.role}: ${t.content}`)
            .join('\n');
    } catch (error) {
        console.error(`[DB] Error getting transcript for ${callSid}:`, error);
        return '';
    }
}

export async function getAllTranscripts() {
    // This is used for legacy or debugging, might be better to return per call
    const all = await prisma.transcript.findMany({
        orderBy: { timestamp: 'asc' }
    });

    // Group by callSid
    return all.reduce((acc, curr) => {
        if (!acc[curr.callSid]) acc[curr.callSid] = [];
        acc[curr.callSid].push({
            role: curr.role as any,
            content: curr.content,
            timestamp: curr.timestamp.getTime()
        });
        return acc;
    }, {} as Record<string, any[]>);
}

export async function setCallAgent(callSid: string, agentId: string, from?: string, to?: string, direction?: string) {
    try {
        await prisma.call.upsert({
            where: { callSid },
            update: { agentId, from, to, direction },
            create: {
                callSid,
                agentId,
                from,
                to,
                direction,
                startTime: new Date()
            }
        });
        console.log(`[DB] Saved call metadata: ${callSid} -> agent ${agentId} (${from} -> ${to})`);
    } catch (error) {
        console.error(`[DB] Error setting call agent for ${callSid}:`, error);
    }
}

export async function getCallAgent(callSid: string): Promise<string | undefined> {
    try {
        const call = await prisma.call.findUnique({
            where: { callSid }
        });
        return call?.agentId;
    } catch (error) {
        console.error(`[DB] Error getting call agent for ${callSid}:`, error);
        return undefined;
    }
}

export async function getCall(callSid: string) {
    try {
        return await prisma.call.findUnique({
            where: { callSid }
        });
    } catch (error) {
        console.error(`[DB] Error getting call ${callSid}:`, error);
        return null;
    }
}

// Pricing & Billing Logic
import { calculateCallCost, PRICING_PLANS } from './pricing';

export async function updateCallStatus(callSid: string, duration: number, status: string, recordingUrl?: string) {
    try {
        // 1. Get Call and associated Agent/User
        const call = await prisma.call.findUnique({
            where: { callSid },
            include: {
                agent: {
                    include: { user: true }
                }
            }
        });

        if (!call || !call.agent) {
            console.error(`[DB] Call or Agent not found for billing: ${callSid}`);
            return;
        }

        const user = call.agent.user;
        let cost = 0;

        // 2. Calculate Cost (if User exists)
        if (user) {
            const { billedCost } = calculateCallCost(user.plan, duration);
            cost = billedCost;

            // 3. Update User Balance/Usage
            // If they are on a limited plan (Starter) or exceeded included minutes, we deduct credits
            const plan = PRICING_PLANS[user.plan as keyof typeof PRICING_PLANS] || PRICING_PLANS.STARTER;

            const minutesUsed = Math.ceil(duration / 60);

            // Simple logic: If they have included minutes remaining, increment usage count.
            // If they are over, or on Starter, bill them.

            let billable = false;
            if (plan.includedMinutes > 0) {
                if (user.usageMinutesUsed < plan.includedMinutes) {
                    // Still inside included minutes
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { usageMinutesUsed: { increment: minutesUsed } }
                    });
                } else {
                    // Overage
                    billable = true;
                }
            } else {
                // Pay as you go
                billable = true;
            }

            if (billable) {
                // Deduct from credits
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        creditsBalance: { decrement: cost },
                        usageMinutesUsed: { increment: minutesUsed }
                    }
                });

                // Log Transaction
                if (cost > 0) {
                    await prisma.transaction.create({
                        data: {
                            userId: user.id,
                            amount: -cost,
                            type: 'DEBIT',
                            description: `Call usage: ${minutesUsed} min (${status})`
                        }
                    });
                }
            }
        }

        // 4. Update Call Record
        await prisma.call.update({
            where: { callSid },
            data: {
                duration,
                cost,
                status,
                endTime: new Date(),
                recordingUrl
            }
        });

        console.log(`[DB] Call ${callSid} finalized. Duration: ${duration}s. Cost: $${cost}`);

    } catch (error) {
        console.error(`[DB] Error updating call status for ${callSid}:`, error);
    }
}

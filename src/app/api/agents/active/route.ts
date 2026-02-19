import { NextResponse } from 'next/server';
import { getActiveAgentId, setActiveAgentId } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getAgentById } from '@/lib/agents';

export async function GET() {
    return NextResponse.json({ activeAgentId: await getActiveAgentId() });
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await req.json();
        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        const isAdmin = session.user.role === 'admin';
        const userId = session.user.id;
        const assignedAgentId = session.user.assignedAgentId;

        // Verify agent existence and ownership
        const agent = await getAgentById(id);
        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        const isOwner = agent.userId === userId;
        const isAssigned = agent.id === assignedAgentId;

        if (!isAdmin && !isOwner && !isAssigned) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await setActiveAgentId(id);
        return NextResponse.json({ success: true, activeAgentId: id });
    } catch (error) {
        console.error('Error setting active agent:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

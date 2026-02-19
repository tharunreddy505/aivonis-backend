import { NextResponse } from 'next/server';
import { getAgentById, updateAgent, deleteAgent } from '@/lib/agents';
import { deleteUserByAgentId } from '@/lib/users';
import { auth } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const agent = await getAgentById(id);
        if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        return NextResponse.json(agent);
    } catch (error: any) {
        console.error('[API] Error fetching agent:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        // Check ownership before updating
        const existingAgent = await getAgentById(id);
        if (!existingAgent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        const isAdmin = session.user.role === 'admin';
        const isOwner = existingAgent.userId === session.user.id;

        if (!isAdmin && !isOwner) {
            return NextResponse.json({ error: 'Forbidden: You can only edit agents you created' }, { status: 403 });
        }

        const updatedAgent = await updateAgent(id, body);
        if (!updatedAgent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        return NextResponse.json(updatedAgent);
    } catch (error: any) {
        console.error('Error in PUT agent:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Check ownership before deleting
        const existingAgent = await getAgentById(id);
        if (!existingAgent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        const isAdmin = session.user.role === 'admin';
        const isOwner = existingAgent.userId === session.user.id;

        if (!isAdmin && !isOwner) {
            return NextResponse.json({ error: 'Forbidden: You can only delete agents you created' }, { status: 403 });
        }

        // Delete associated user first
        await deleteUserByAgentId(id);

        // Then delete the agent
        const success = await deleteAgent(id);
        if (!success) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in DELETE agent:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

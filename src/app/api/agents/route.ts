import { NextResponse } from 'next/server';
import { createAgent, getAgents } from '@/lib/agents';
import { createUser, getUserByEmail } from '@/lib/users';
import { auth } from '@/lib/auth';

export async function GET() {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = session.user.role === 'admin';
        const userId = session.user.id;
        const assignedAgentId = session.user.assignedAgentId;

        // If admin, pass undefined to get all agents.
        // If staff/user, pass userId (owner) and assignedAgentId (linked).

        if (!isAdmin && !userId) {
            return NextResponse.json([]);
        }

        const agents = await getAgents(
            isAdmin ? undefined : userId,
            isAdmin ? undefined : assignedAgentId
        );

        return NextResponse.json(agents);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, prompt, voice, gender, user } = body;

        if (!name || !prompt || !voice || !gender) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create the agent first
        const newAgent = await createAgent({
            userId: session.user.id, // Assign ownership to creator
            name,
            prompt,
            voice,
            gender,
            firstSentence: body.firstSentence,
            transcriptionEmail: body.transcriptionEmail,
            sendEmailAfterCall: body.sendEmailAfterCall,
            maxCallDuration: body.maxCallDuration,
            maxWaitTime: body.maxWaitTime,
            companyInfo: body.companyInfo
        });

        // If user data provided (e.g. creating a dedicated staff account for this agent)
        if (user && user.email && user.password && user.name) {
            // Check if email already exists
            const existingUser = await getUserByEmail(user.email);
            if (existingUser) {
                return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
            }

            // Create staff user linked to this agent
            await createUser({
                email: user.email,
                password: user.password,
                name: user.name,
                role: 'staff',
                assignedAgentId: newAgent.id
            });

            console.log(`[Agents API] Created user ${user.email} for agent ${newAgent.id}`);
        }

        return NextResponse.json(newAgent, { status: 201 });
    } catch (error: any) {
        console.error('Error creating agent:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

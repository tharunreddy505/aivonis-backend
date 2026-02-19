import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
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

        const whereClause: any = {};

        if (!isAdmin) {
            if (!userId) {
                return NextResponse.json([]);
            }
            const orConditions: any[] = [{ agent: { userId: userId } }];
            if (assignedAgentId) {
                orConditions.push({ agentId: assignedAgentId });
            }

            whereClause.OR = orConditions;
        }

        const numbers = await prisma.phoneNumber.findMany({
            where: whereClause,
            include: {
                agent: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return NextResponse.json(numbers);
    } catch (error) {
        console.error('Error fetching numbers:', error);
        return NextResponse.json({ error: 'Failed to fetch numbers' }, { status: 500 });
    }
}

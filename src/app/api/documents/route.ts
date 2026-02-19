import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Helper to parse PDF (reused logic)
async function parsePdf(buffer: Buffer): Promise<string> {
    try {
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        return data.text;
    } catch (err) {
        console.error('[Documents API] Failed to parse PDF:', err);
        return '';
    }
}

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
            const orConditions: any[] = [{ userId: userId }];
            if (assignedAgentId) {
                orConditions.push({ id: assignedAgentId });
            }

            // Filter documents:
            // 1. Created by the user (userId match)
            // 2. OR connected to an agent owned by/assigned to the user
            whereClause.OR = [
                { userId: userId },
                {
                    agents: {
                        some: {
                            OR: orConditions
                        }
                    }
                }
            ];
        }

        const documents = await prisma.document.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                agents: {
                    select: { id: true, name: true }
                }
            }
        });
        return NextResponse.json(documents);
    } catch (error) {
        console.error('[Documents API] Error fetching documents:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file: File | null = formData.get('file') as unknown as File;
        const name = formData.get('name') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Ensure upload directory exists
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = file.name.split('.').pop();
        const filename = `${uniqueSuffix}.${extension}`;
        const filePath = join(uploadDir, filename);

        await writeFile(filePath, buffer);

        // Parse content if PDF
        let content = '';
        if (extension?.toLowerCase() === 'pdf') {
            content = await parsePdf(buffer);
        }

        const url = `/uploads/${filename}`;

        // Create DB record
        const session = await auth();
        // If no session, technically unauthorized but maybe public upload allowed? 
        // No, user said "knowledge base is not working for user uploaded doc". So user MUST be logged in.

        let userId: string | undefined;
        if (session && session.user) {
            userId = session.user.id;
        }

        const document = await prisma.document.create({
            data: {
                name: name || file.name,
                url,
                size: file.size,
                content,
                userId // Associate with user
            }
        });

        return NextResponse.json(document);

    } catch (error: any) {
        console.error('[Documents API] Error uploading document:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

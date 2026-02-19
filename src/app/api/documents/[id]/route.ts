
import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { join } from 'path';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function DELETE(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = session.user.role === 'admin';
        const userId = session.user.id;
        const documentId = params.id;

        // Fetch document to verify ownership and get file path
        const document = await prisma.document.findUnique({
            where: { id: documentId },
            include: { agents: true } // Check dependencies if needed
        });

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Check permission
        if (!isAdmin && document.userId && document.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete from DB
        await prisma.document.delete({
            where: { id: documentId }
        });

        // Try to delete file from filesystem
        if (document.url && document.url.startsWith('/uploads/')) {
            try {
                const filename = document.url.replace('/uploads/', '');
                const filePath = join(process.cwd(), 'public', 'uploads', filename);
                await unlink(filePath);
            } catch (fsError) {
                console.warn('[Documents API] Failed to delete file from disk:', fsError);
                // Continue, as DB record is deleted
            }
        }

        return NextResponse.json({ success: true, id: documentId });

    } catch (error) {
        console.error('[Documents API] Error deleting document:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

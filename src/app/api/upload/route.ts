import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

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

        // Generate unique filename to avoid collision
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = file.name.split('.').pop();
        const filename = `${uniqueSuffix}.${extension}`;
        const filePath = join(uploadDir, filename);

        await writeFile(filePath, buffer);

        // Parse PDF content
        let content = '';
        if (extension?.toLowerCase() === 'pdf') {
            try {
                const pdfParse = require('pdf-parse');
                const data = await pdfParse(buffer);
                content = data.text;
            } catch (err) {
                console.error('[Upload] Failed to parse PDF:', err);
                // Continue without content if parsing fails
            }
        }

        // Return the public URL
        const url = `/uploads/${filename}`;

        return NextResponse.json({
            success: true,
            url,
            name: name || file.name,
            size: file.size,
            content // Include extracted content
        });

    } catch (error: any) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

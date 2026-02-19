import { NextResponse } from 'next/server';
import { generateSpeech } from '@/lib/ai';

export async function POST(req: Request) {
    try {
        const { text, voice } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const audioBuffer = await generateSpeech(text, voice || 'nova');

        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('TTS error:', error);
        return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
    }
}

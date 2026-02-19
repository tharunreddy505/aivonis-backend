
import { NextRequest, NextResponse } from 'next/server';
import { generateSpeech } from '@/lib/ai';
import { getSettings } from '@/lib/config';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const voice = searchParams.get('voice') as any;
    const text = searchParams.get('text') || 'Hello! I am your AI assistant. I can help you manage your calls and appointments.';

    if (!voice) {
        return NextResponse.json({ error: 'Voice parameter is required' }, { status: 400 });
    }

    try {
        const settings = await getSettings();
        if (!settings.openaiApiKey || settings.openaiApiKey === 'missing-key') {
            console.error('Missing OpenAI API Key');
            return NextResponse.json({ error: 'OpenAI API Key is not configured' }, { status: 503 });
        }

        const audioBuffer = await generateSpeech(text, voice);

        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.length.toString(),
            },
        });
    } catch (error: any) {
        console.error('Error generating speech preview:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate speech' }, { status: 500 });
    }
}

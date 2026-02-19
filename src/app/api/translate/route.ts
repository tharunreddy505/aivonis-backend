import { NextResponse } from 'next/server';
import { translateText } from '@/lib/ai';

export async function POST(req: Request) {
    try {
        const { text, targetLanguage } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const translatedText = await translateText(text, targetLanguage || 'German');

        return NextResponse.json({ translatedText });
    } catch (error) {
        console.error('Translation error:', error);
        return NextResponse.json({ error: 'Failed to translate text' }, { status: 500 });
    }
}

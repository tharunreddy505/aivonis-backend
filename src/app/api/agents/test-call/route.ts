
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getSettings } from '@/lib/config';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import fs from 'fs';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const prompt = formData.get('prompt') as string;
        const voice = formData.get('voice') as any;
        const historyJson = formData.get('history') as string;
        const history = historyJson ? JSON.parse(historyJson) : [];

        const settings = await getSettings();
        if (!settings.openaiApiKey) {
            return NextResponse.json({ error: 'OpenAI API Key missing' }, { status: 500 });
        }

        const openai = new OpenAI({ apiKey: settings.openaiApiKey });
        let userText = '';

        const userTextParam = formData.get('userText') as string | null;

        // 1. Transcribe Audio (if file provided AND no direct text override)
        if (userTextParam) {
            userText = userTextParam;
        } else if (file) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const tempFilePath = join(tmpdir(), `upload_${Date.now()}.webm`);
            await writeFile(tempFilePath, buffer);

            try {
                const transcription = await openai.audio.transcriptions.create({
                    file: fs.createReadStream(tempFilePath),
                    model: 'whisper-1',
                    language: 'en', // Force English transcription to avoid language switching on noise
                });
                userText = transcription.text;
            } finally {
                // Cleanup
                try { await unlink(tempFilePath); } catch (e) { console.error('Error deleting temp file', e); }
            }
        }



        const firstSentence = formData.get('firstSentence') as string;

        // 2. Generate AI Response
        let assistantText = '';

        // Handle case where voice input failed to transcribe
        if (file && !userText.trim()) {
            userText = '(No speech detected)';
            assistantText = "I didn't quite catch that. Could you please say it again?";
        }
        // Check if this is the start of the call and we have a custom first sentence
        else if (!file && history.length === 0 && firstSentence && !userText) {
            assistantText = firstSentence;
        } else {
            // Enhanced system prompt for silence handling
            const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const currentTime = new Date().toLocaleTimeString('en-US');

            const systemContent = (prompt || 'You are a helpful assistant.') +
                `\n\nCONTEXT: Current Date: ${currentDate}. Current Time: ${currentTime}.` +
                '\n\nBEHAVIORAL INSTRUCTION: If the user input is exactly "[SILENCE_1]", you must say "Hello? Is anyone still on the line? I\'ll end the call otherwise." If the user input is "[SILENCE_2]", you must say "Alright, I\'ll end the call now. Goodbye!" and STOP talking.' +
                '\n\nKeep your responses concise and conversational.';

            const messages = [
                { role: 'system', content: systemContent },
                ...history,
            ];

            if (userText) {
                messages.push({ role: 'user', content: userText });
            } else if (history.length === 0) {
                // Force a greeting trigger if it's the start
                messages.push({ role: 'user', content: 'Hello, I am calling about your services.' });
            }

            // Check specifically for silence tags to maybe shortcut or guide stronger
            if (userText === '[SILENCE_2]') {
                // We can optionally force the text to ensure it ends
                // assistantText = "Goodbye."; 
                // But letting LLM generate is usually fine if instructed.
            }

            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: messages,
            });

            assistantText = completion.choices[0].message.content || 'Hello';
        }

        // 3. Generate Speech
        const mp3 = await openai.audio.speech.create({
            model: 'tts-1',
            voice: voice || 'alloy',
            input: assistantText,
        });

        const audioBuffer = Buffer.from(await mp3.arrayBuffer());
        const audioBase64 = audioBuffer.toString('base64');

        return NextResponse.json({
            userText,
            assistantText,
            audio: `data:audio/mpeg;base64,${audioBase64}`
        });

    } catch (error: any) {
        console.error('Test Call Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

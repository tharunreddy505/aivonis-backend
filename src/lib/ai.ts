import OpenAI from 'openai';

import { getSettings } from './config';

async function getOpenAI() {
    const settings = await getSettings();
    return new OpenAI({
        apiKey: settings.openaiApiKey || 'missing-key',
    });
}

export async function generateAIResponse(prompt: string, userMessage: string) {
    const openai = await getOpenAI();
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: userMessage },
        ],
    });

    return response.choices[0].message.content;
}

/**
 * Maps simple 'male'/'female' choice to OpenAI TTS voices
 */
export function getVoiceForGender(gender: 'male' | 'female'): 'onyx' | 'shimmer' {
    return gender === 'male' ? 'onyx' : 'shimmer';
}

export async function translateText(text: string, targetLanguage: string) {
    const openai = await getOpenAI();
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: `You are a professional translator. Translate the following transcript into ${targetLanguage}. 
                CRITICAL: You MUST maintain the speaker labels "User:" and "Assistant:" EXACTLY at the beginning of each line. 
                Translate the content after the labels. Translate the ENTIRE conversation from start to finish.`
            },
            { role: 'user', content: text },
        ],
    });

    return response.choices[0].message.content;
}

export async function generateSpeech(text: string, voice: 'onyx' | 'shimmer' | 'alloy' | 'echo' | 'fable' | 'nova' = 'nova') {
    const openai = await getOpenAI();
    const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice,
        input: text,
    });

    return Buffer.from(await response.arrayBuffer());
}

export async function transcribeAudio(audioBuffer: Buffer) {
    const openai = await getOpenAI();
    // OpenAI expects a file object, but we have a buffer. 
    // We can work around this by creating a mock file object where acceptable,
    // but the official SDK often wants a File or ReadStream.
    // A simple way with the SDK and Buffer is to pass a "file-like" object 
    // with `name`, `type`, and `lastModified`.

    // However, the cleanest way in a Node environment (which Next.js API routes are)
    // is often to use the `toFile` helper if available, or just pass a Blob/File from `node-fetch`.
    // Since we are likely receiving FormData in the API route, we can just pass that file directly 
    // if we structure the API route correctly.

    // Ideally, this function shouldn't take a Buffer if it's tricky.
    // Let's assume the API route calls OpenAI directly to avoid Buffer complexity here
    // OR we implement a simple workaround.

    // For now, let's keep the API route logic together.
    return null;
}

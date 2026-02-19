import { NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai';
import { getSettings } from '@/lib/config';

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const settings = await getSettings();
        if (!settings.openaiApiKey || settings.openaiApiKey === 'missing-key') {
            return NextResponse.json({ error: 'OpenAI API Key is not configured. Please contact admin.' }, { status: 503 });
        }

        // Fetch user specified URL
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout to 15s

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Failed to fetch page: ${response.statusText}`);
            }

            const html = await response.text();

            // Simple cleanup: remove script, style, and comments
            const cleanText = html
                .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
                .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
                .replace(/<!--[\s\S]*?-->/g, "")
                .replace(/<[^>]+>/g, " ") // All tags
                .replace(/\s+/g, " ")     // Extra whitespace
                .trim()
                .substring(0, 15000); // Reasonable limit

            // AI Summarization
            const prompt = `You are a helpful assistant. Extract relevant Company Information from the text below. Include:
            - Company Name & Brief Description
            - Core Services/Products offered
            - Opening Hours (if mentioned)
            - Contact Info (Phone/Email if mentioned)
            - 2-3 likely Frequently Asked Questions based on the content
            
            Format the output as a clean paragraph or bullet points suitable for an AI agent's knowledge base. Do not include markdown code blocks.`;

            let info;
            try {
                info = await generateAIResponse(prompt, cleanText);
            } catch (aiError: any) {
                console.error('OpenAI API Error (falling back to basic extraction):', aiError);

                // Fallback: Basic regex extraction
                const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
                const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
                const phoneMatch = html.match(/(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
                const emailMatch = html.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/);

                const title = titleMatch ? titleMatch[1].trim() : 'Company Name';
                const desc = descMatch ? descMatch[1].trim() : 'No description found.';
                const phone = phoneMatch ? phoneMatch[0] : 'Not found';
                const email = emailMatch ? emailMatch[0] : 'Not found';

                info = `**${title}**\n\n${desc}\n\n**Contact Info:**\nPhone: ${phone}\nEmail: ${email}\n\n(Note: This info was extracted automatically as AI services are receiving high traffic.)`;
            }

            return NextResponse.json({ info });

        } catch (fetchError: any) {
            console.error('Fetch error:', fetchError);
            return NextResponse.json({ error: `Could not access website: ${fetchError.message}` }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Error generating company info:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

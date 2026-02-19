import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { generateAIResponse } from '@/lib/ai';
import { getAgentById, getAgentByPhoneNumber } from '@/lib/agents';

const VoiceResponse = twilio.twiml.VoiceResponse;

// Map OpenAI voice names to Twilio Polly voices
const voiceMap: Record<string, string> = {
    'shimmer': 'Polly.Joanna-Neural',
    'alloy': 'Polly.Salli-Neural',
    'nova': 'Polly.Kimberly-Neural',
    'onyx': 'Polly.Matthew-Neural',
    'echo': 'Polly.Joey-Neural',
    'fable': 'Polly.Amy-Neural',
};

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const speechResult = formData.get('SpeechResult') as string;
        const to = formData.get('To') as string;
        const callSid = formData.get('CallSid') as string;
        let agentId = new URL(req.url).searchParams.get('agentId');

        console.log(`[Voice] Incoming call to ${to} (SID: ${callSid}). Params Agent: ${agentId}, Speech: ${speechResult || '(initial greeting)'}`);

        let agent;

        if (agentId) {
            agent = await getAgentById(agentId);
        } else if (to) {
            agent = await getAgentByPhoneNumber(to);
            if (agent) {
                console.log(`[Voice] Resolved agent ${agent.name} (${agent.id}) from phone number ${to}`);
                agentId = agent.id;
            }
        }

        if (!agent) {
            console.error(`[Voice] Agent not found for call to ${to} (AgentID: ${agentId})`);
            const twiml = new VoiceResponse();
            twiml.say('I am sorry, but I cannot connect you to an agent at this time. Goodbye.');
            return new NextResponse(twiml.toString(), {
                headers: { 'Content-Type': 'text/xml' },
            });
        }

        const twiml = new VoiceResponse();
        // Use the mapped voice or fallback to 'alice'
        const twilioVoice = voiceMap[agent.voice] || 'alice';

        if (!speechResult) {
            // Start recording the call
            try {
                const { getTwilioClient } = await import('@/lib/twilio');
                const client = await getTwilioClient();
                // Check if already recording? Twilio handles duplicates usually or throws.
                // We'll just try to create a recording.
                await client.calls(callSid).recordings.create();
                console.log(`[Voice] Started recording for ${callSid}`);
            } catch (recError) {
                console.warn('[Voice] Could not start recording:', recError);
            }

            // Initial greeting
            twiml.say(
                { voice: twilioVoice as any },
                `Hello, I am ${agent.name}. How can I help you today?`
            );
        } else {
            // Process user speech and generate response
            try {
                const aiResponse = await generateAIResponse(agent.prompt, speechResult);
                console.log(`[Voice] AI Response: ${aiResponse}`);
                twiml.say({ voice: twilioVoice as any }, aiResponse || "I didn't quite catch that.");
            } catch (aiError) {
                console.error('[Voice] OpenAI Error:', aiError);
                twiml.say({ voice: twilioVoice as any }, "I'm sorry, I'm having trouble connecting to my brain right now.");
            }
        }

        // Continue the conversation
        twiml.gather({
            input: ['speech'],
            action: `/voice/incoming?agentId=${agentId}`,
            method: 'POST',
            speechTimeout: 'auto',
        });

        const responseXml = twiml.toString();
        return new NextResponse(responseXml, {
            headers: { 'Content-Type': 'text/xml' },
        });
    } catch (error) {
        console.error('[Voice] Critical Route Error:', error);
        const twiml = new VoiceResponse();
        twiml.say('An internal error occurred. Please try again later.');
        return new NextResponse(twiml.toString(), {
            headers: { 'Content-Type': 'text/xml' },
        });
    }
}

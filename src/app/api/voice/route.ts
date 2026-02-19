import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { generateAIResponse, getVoiceForGender } from '@/lib/ai';
import { getAgents, getAgentById, getAgentByPhoneNumber } from '@/lib/agents';
import { getSettings } from '@/lib/config';
import { addTranscript, getActiveAgentId, setCallAgent, getCall } from '@/lib/db';

const VoiceResponse = twilio.twiml.VoiceResponse;

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
        const digits = formData.get('Digits') as string;
        const callSid = formData.get('CallSid') as string;
        const from = formData.get('From') as string;
        const to = formData.get('To') as string;
        const direction = (formData.get('Direction') as string) || 'inbound';

        // Use query param OR active agent from DB
        let agentId = new URL(req.url).searchParams.get('agentId');

        // If no agentId in URL, try to find assigned agent for the 'To' number
        if (!agentId && to) {
            const assignedAgent = await getAgentByPhoneNumber(to);
            if (assignedAgent) {
                agentId = assignedAgent.id;
                console.log(`[Voice] Routed call to ${to} -> Agent ${agentId} (${assignedAgent.name})`);
            }
        }

        // If still no agentId and no selection made yet, show IVR menu
        if (!agentId && !digits) {
            const agents = await getAgents();
            const twiml = new VoiceResponse();

            if (agents.length === 0) {
                twiml.say('No agents are currently available. Please try again later.');
                return new NextResponse(twiml.toString(), {
                    headers: { 'Content-Type': 'text/xml' },
                });
            }

            // Only show menu if we couldn't determine agent automatically
            // If we have agents but couldn't route by number, maybe fallback to first agent or active agent?
            // Existing logic shows menu.

            const gather = twiml.gather({
                numDigits: 1,
                action: '/api/voice',
                method: 'POST',
                timeout: 10,
            });

            let menuMessage = 'Welcome. ';
            agents.slice(0, 9).forEach((agent, index) => {
                menuMessage += `Press ${index + 1} to speak with ${agent.name}. `;
            });

            gather.say(menuMessage);

            // Fallback if they don't press anything
            twiml.redirect('/api/voice');

            return new NextResponse(twiml.toString(), {
                headers: { 'Content-Type': 'text/xml' },
            });
        }

        // If digits were pressed, find the agent
        if (digits) {
            const agents = await getAgents();
            const selectionIndex = parseInt(digits) - 1;
            if (selectionIndex >= 0 && selectionIndex < agents.length) {
                agentId = agents[selectionIndex].id;
            } else {
                // Invalid selection, back to menu
                const twiml = new VoiceResponse();
                twiml.say('Invalid selection.');
                twiml.redirect('/api/voice');
                return new NextResponse(twiml.toString(), {
                    headers: { 'Content-Type': 'text/xml' },
                });
            }
        }

        // Now we definitely have an agentId (either from URL, number lookup, or selection)
        if (!agentId) {
            agentId = await getActiveAgentId();
        }

        console.log(`[Voice] Processing call ${callSid}. Agent: ${agentId}. Speech: ${speechResult ? speechResult.substring(0, 50) : 'None'}`);

        const agent = await getAgentById(agentId!);
        if (!agent) {
            const twiml = new VoiceResponse();
            twiml.say('Agent not found. Goodbye.');
            return new NextResponse(twiml.toString(), {
                headers: { 'Content-Type': 'text/xml' },
            });
        }

        // Check Maximum Call Duration
        if (callSid) {
            const call = await getCall(callSid);
            if (call && agent.maxCallDuration) {
                const durationMins = (Date.now() - new Date(call.startTime).getTime()) / 60000;
                if (durationMins >= agent.maxCallDuration) {
                    console.log(`[Voice] Call ${callSid} exceeded max duration (${agent.maxCallDuration} mins). Ending call.`);
                    const twiml = new VoiceResponse();
                    twiml.say('Thank you for calling. The maximum call duration has been reached. Goodbye.');
                    twiml.hangup();
                    return new NextResponse(twiml.toString(), {
                        headers: { 'Content-Type': 'text/xml' },
                    });
                }
            }
        }

        const twiml = new VoiceResponse();
        const twilioVoice = voiceMap[agent.voice] || 'alice';

        // Initial connection to the agent (either via selection or direct URL)
        if (!speechResult) {
            // Check if we've already greeted for this call to avoid repeating
            // Actually, in Twilio, we can just check if this is the first turn
            // If digits is present, it's definitely the first turn after selection.
            // If neither speech nor digits is present but agentId is, it's a direct call.

            const initialGreeting = `Hello, I am ${agent.name}. How can I help you today?`;

            if (callSid) {
                console.log(`[Voice] Adding initial greeting to transcript for ${callSid}`);
                await setCallAgent(callSid, agentId!, from, to, direction);
                await addTranscript(callSid, 'assistant', initialGreeting);

                // Start Recording
                try {
                    const settings = await getSettings();
                    const accountSid = settings.twilioAccountSid;
                    const authToken = settings.twilioAuthToken;
                    if (accountSid && authToken) {
                        const client = twilio(accountSid, authToken);
                        const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
                        await client.calls(callSid).recordings.create({
                            recordingStatusCallback: `${baseUrl}/api/voice/status`,
                            recordingStatusCallbackEvent: ['completed']
                        });
                    }
                } catch (recError) {
                    console.error('[Voice] Failed to start recording:', recError);
                }
            }

            twiml.say({ voice: twilioVoice as any }, initialGreeting);
        } else if (speechResult) {
            // Processing ongoing conversation
            if (callSid) {
                await addTranscript(callSid, 'user', speechResult);
            }

            try {
                // Prepare prompt with document context
                let systemPrompt = agent.prompt;

                if (agent.documents && agent.documents.length > 0) {
                    const docContent = agent.documents
                        .map(d => d.content)
                        .filter(c => c && c.trim().length > 0)
                        .join('\n\n');

                    if (docContent) {
                        systemPrompt += `\n\n[RELEVANT DOCUMENTS START]\n${docContent}\n[RELEVANT DOCUMENTS END]\n
                        Use the information from the documents above to answer questions if relevant.`;
                    }
                }

                const aiResponse = await generateAIResponse(systemPrompt, speechResult);
                if (callSid && aiResponse) {
                    await addTranscript(callSid, 'assistant', aiResponse);
                }
                twiml.say({ voice: twilioVoice as any }, aiResponse || "I didn't quite catch that.");
            } catch (error) {
                console.error('[Voice] Error generating AI response:', error);
                twiml.say({ voice: twilioVoice as any }, "I'm sorry, I'm having trouble connecting.");
            }
        }

        // Listen for next speech
        twiml.gather({
            input: ['speech'],
            action: `/api/voice?agentId=${agentId}`,
            method: 'POST',
            speechTimeout: 'auto',
            timeout: agent.maxWaitTime || 10
        });

        return new NextResponse(twiml.toString(), {
            headers: { 'Content-Type': 'text/xml' },
        });
    } catch (error) {
        console.error('[Voice] Internal Error:', error);
        return new NextResponse('<Response><Say>Internal Error</Say></Response>', {
            headers: { 'Content-Type': 'text/xml' },
        });
    }
}

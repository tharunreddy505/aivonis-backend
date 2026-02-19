
import { useState, useRef, useEffect } from 'react';
import { Mic, Phone, X, Volume2, User, Bot, Loader2 } from 'lucide-react';

interface TestCallModalProps {
    isOpen: boolean;
    onClose: () => void;
    agentName: string;
    agentPrompt: string;
    agentVoice: string;
    agentFirstSentence?: string;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function TestCallModal({ isOpen, onClose, agentName, agentPrompt, agentVoice, agentFirstSentence }: TestCallModalProps) {
    const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'playing'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesRef = useRef<Message[]>([]); // Ref to hold latest messages for closures
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const isOpenRef = useRef(isOpen);

    // Sync isOpenRef with isOpen prop
    useEffect(() => {
        isOpenRef.current = isOpen;
    }, [isOpen]);

    // Initial greeting on open
    // Initial greeting and stream setup on open
    useEffect(() => {
        if (isOpen) {
            setMessages([]);
            messagesRef.current = []; // Reset ref
            initializeStream();
            // Trigger initial greeting
            handleSendAudio(null);
        } else {
            stopAll();
        }
    }, [isOpen]);

    const initializeStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
        } catch (error) {
            console.error('Error initializing stream:', error);
            setError('Could not access microphone. Please check permissions.');
        }
    };

    const stopAll = () => {
        resetSilenceTimer();
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setStatus('idle');
    };

    const startTimeRef = useRef<number>(0);

    const startRecording = async () => {
        if (!streamRef.current) {
            await initializeStream();
            if (!streamRef.current) return;
        }

        setError(null);
        try {
            // Use existing stream for instant start
            const mediaRecorder = new MediaRecorder(streamRef.current);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            startTimeRef.current = Date.now();

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const duration = Date.now() - startTimeRef.current;
                if (duration < 500) {
                    // Too short, ignore
                    return;
                }
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                handleSendAudio(audioBlob);
            };

            mediaRecorder.start();
            setStatus('recording');
        } catch (error: any) {
            console.error('Error starting recording:', error);
            setError('Could not start recording: ' + error.message);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            const duration = Date.now() - startTimeRef.current;
            if (duration < 500) {
                setStatus('idle'); // Just reset to idle if too short
            } else {
                setStatus('processing');
            }
        }
    };

    const silenceCountRef = useRef(0);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const resetSilenceTimer = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceCountRef.current = 0;
    };

    const startSilenceTimer = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        silenceTimerRef.current = setTimeout(() => {
            handleSilenceTrigger();
        }, 8000); // 8 seconds silence timeout
    };

    const handleSilenceTrigger = () => {
        if (!isOpenRef.current) return;

        silenceCountRef.current += 1;
        const newCount = silenceCountRef.current;

        // Create a fake event to send silence
        const text = newCount === 1 ? '[SILENCE_1]' : '[SILENCE_2]';
        if (newCount <= 2) {
            handleSendAudio(null, text);
        } else {
            // End call automatically?
            onClose();
        }
    };

    const handleSendAudio = async (audioBlob: Blob | null, textOverride?: string) => {
        // If sending audio, reset silence count (user spoke)
        if (audioBlob) {
            resetSilenceTimer();
        }

        setStatus('processing');

        const formData = new FormData();
        if (audioBlob) {
            formData.append('file', audioBlob);
        } else if (textOverride) {
            // Append as userText to bypass transcription in backend
            formData.append('userText', textOverride);
        }

        formData.append('prompt', agentPrompt);
        formData.append('voice', agentVoice);
        if (agentFirstSentence) {
            formData.append('firstSentence', agentFirstSentence);
        }
        // Use ref for history to avoid stale closures in timeouts/event listeners
        formData.append('history', JSON.stringify(messagesRef.current));

        try {
            const response = await fetch('/api/agents/test-call', {
                method: 'POST',
                body: formData,
            });

            if (!isOpenRef.current) return; // Stop if closed during fetch

            if (!response.ok) {
                const errorText = await response.text();
                let errMsg = `Server Error: ${response.status}`;
                try {
                    const json = JSON.parse(errorText);
                    if (json.error) errMsg = json.error;
                } catch (e) {
                    errMsg = errorText || errMsg;
                }
                throw new Error(errMsg);
            }

            const data = await response.json();

            // Update conversation history
            const newMessages = [...messagesRef.current];
            if (data.userText) {
                const display = data.userText.includes('[SILENCE') ? '(Silence...)' : data.userText;
                newMessages.push({ role: 'user', content: display });
            }
            newMessages.push({ role: 'assistant', content: data.assistantText });

            // Update both state and ref
            setMessages(newMessages);
            messagesRef.current = newMessages;

            // Play audio
            if (data.audio) {
                const audio = new Audio(data.audio);
                audioPlayerRef.current = audio;

                audio.onended = () => {
                    if (isOpenRef.current) {
                        setStatus('idle');
                        // Start silence timer after agent finishes
                        startSilenceTimer();
                    }
                };

                setStatus('playing');
                audio.play().catch(e => {
                    console.error("Playback error:", e);
                    if (isOpenRef.current) setStatus('idle');
                });
            } else {
                setStatus('idle');
                startSilenceTimer();
            }

        } catch (error: any) {
            // Check for specific "Audio too short" error (expected user behavior)
            // Handle this silently without logging console.error to avoid Next.js error overlay
            if (error.message && error.message.includes('Audio file is too short')) {
                const newMessages = [...messagesRef.current];
                newMessages.push({ role: 'user', content: '(Recording too short)' });
                newMessages.push({ role: 'assistant', content: 'I couldn\'t hear you. Please hold the button while speaking.' });
                setMessages(newMessages);
                messagesRef.current = newMessages;

                setStatus('idle');
                return;
            }

            console.error('Error in test call:', error);

            if (isOpenRef.current) {
                setError(error.message || 'Call failed. Please try again.');
                setStatus('idle');
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[600px]">
                {/* Phone Call UI */}
                <div className="flex-1 bg-slate-50 flex flex-col items-center justify-between p-8 relative overflow-hidden">
                    {/* Background Elements */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-100/50 via-slate-50 to-slate-50 pointer-events-none"></div>

                    {/* Header Info */}
                    <div className="text-center z-10 mt-8">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-blue-900/20 relative">
                            <Bot size={48} className="text-white" />
                            {status === 'playing' && (
                                <span className="absolute inset-0 rounded-full border-2 border-blue-400 opacity-75 animate-ping"></span>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">{agentName}</h2>
                        <p className={`text-sm tracking-widest uppercase font-medium ${status === 'playing' ? 'text-blue-600 animate-pulse' :
                            status === 'recording' ? 'text-red-500 animate-pulse' :
                                status === 'processing' ? 'text-yellow-600' : 'text-slate-500'
                            }`}>
                            {status === 'playing' ? 'Speaking...' :
                                status === 'recording' ? 'Listening...' :
                                    status === 'processing' ? 'Thinking...' : 'Connected'}
                        </p>
                    </div>

                    {/* Conversation History */}
                    <div className="flex-1 w-full max-w-sm overflow-y-auto my-6 px-4 space-y-3">
                        {messages.length === 0 && (
                            <div className="text-center text-slate-500 text-sm mt-10">
                                Start speaking to see the transcript...
                            </div>
                        )}
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`relative max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-blue-100 text-blue-900 border border-blue-200 rounded-tr-sm'
                                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm shadow-sm'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                    </div>

                    {/* Mini Visualizer (only if active) */}
                    {(status === 'playing' || status === 'recording') && (
                        <div className="flex items-center justify-center h-8 gap-1 mb-4">
                            {[...Array(8)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-1 rounded-full transition-all duration-75 ${status === 'playing' ? 'bg-blue-400' : 'bg-red-400'
                                        }`}
                                    style={{
                                        height: `${Math.random() * 20 + 4}px`,
                                        animation: `pulse 0.5s infinite ${i * 0.05}s`
                                    }}
                                ></div>
                            ))}
                        </div>
                    )}

                    {/* Controls */}
                    <div className="w-full z-10 mb-8">
                        {error && (
                            <div className="text-center text-red-400 text-sm mb-4 bg-red-900/20 py-2 rounded-lg border border-red-500/20">
                                {error}
                            </div>
                        )}
                        <div className="flex items-center justify-center gap-8">
                            <button
                                onMouseDown={startRecording}
                                onMouseUp={stopRecording}
                                onTouchStart={startRecording}
                                onTouchEnd={stopRecording}
                                disabled={status === 'processing' || status === 'playing'}
                                className={`flex flex-col items-center gap-2 group select-none transition-all ${status === 'processing' || status === 'playing' ? 'opacity-50 blur-[1px]' : 'opacity-100'
                                    }`}
                            >
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl ${status === 'recording'
                                    ? 'bg-red-500 scale-110 ring-4 ring-red-500/30'
                                    : 'bg-slate-900 group-hover:bg-slate-800'
                                    }`}>
                                    <Mic size={24} className="text-white" />
                                </div>
                                <span className="text-xs font-medium text-slate-500">Hold to Speak</span>
                            </button>

                            <button
                                onClick={onClose}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-xl shadow-red-900/20 group-hover:scale-105">
                                    <Phone size={28} className="text-white fill-white rotate-[135deg]" />
                                </div>
                                <span className="text-xs font-medium text-slate-500 group-hover:text-red-500 transition-colors">End Call</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

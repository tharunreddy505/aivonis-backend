"use client";

import { PhoneIncoming, PhoneOutgoing, Clock, Clipboard, Loader2, Languages, Mic, Mail } from 'lucide-react';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface Call {
    id: string;
    type: 'incoming' | 'outgoing';
    caller: string;
    agent: string;
    agentId?: string;
    duration: string;
    date: string;
    status: string;
    transcript: string;
    recordingUrl?: string | null;
}

function CallsList() {
    const [calls, setCalls] = useState<Call[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCall, setSelectedCall] = useState<Call | null>(null);
    const [translating, setTranslating] = useState(false);
    const [translatedTranscript, setTranslatedTranscript] = useState<string | null>(null);
    const [translatedAudioUrl, setTranslatedAudioUrl] = useState<string | null>(null);
    const [generatingAudio, setGeneratingAudio] = useState(false);
    const [targetLanguage, setTargetLanguage] = useState('Spanish');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [activeTab, setActiveTab] = useState<'transcript' | 'context' | 'actions'>('transcript');
    const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
    const [fetchingAgent, setFetchingAgent] = useState(false);

    const searchParams = useSearchParams();
    const callIdParam = searchParams.get('id');

    const languages = [
        'Spanish', 'French', 'German', 'Italian', 'Portuguese',
        'Hindi', 'Chinese', 'Japanese', 'Korean', 'Arabic',
        'Russian', 'Dutch', 'Turkish'
    ];

    useEffect(() => {
        const fetchCalls = async () => {
            try {
                const response = await fetch('/api/calls');
                if (!response.ok) {
                    throw new Error('Failed to fetch calls');
                }
                const data = await response.json();
                setCalls(data);
            } catch (err) {
                console.error(err);
                setError('Failed to load call history');
            } finally {
                setLoading(false);
            }
        };

        fetchCalls();
    }, []);

    useEffect(() => {
        if (callIdParam && calls.length > 0) {
            const found = calls.find(c => c.id === callIdParam);
            if (found) {
                setSelectedCall(found);
            }
        }
    }, [callIdParam, calls]);

    useEffect(() => {
        const fetchAgent = async () => {
            if (!selectedCall || !selectedCall.agentId) {
                setSelectedAgent(null);
                return;
            }

            setFetchingAgent(true);
            try {
                const response = await fetch(`/api/agents/${selectedCall.agentId}`);
                if (response.ok) {
                    const data = await response.json();
                    setSelectedAgent(data);
                }
            } catch (err) {
                console.error('Failed to fetch agent details', err);
            } finally {
                setFetchingAgent(false);
            }
        };

        fetchAgent();
    }, [selectedCall]);

    const handleTranslate = async () => {
        if (!selectedCall || !selectedCall.transcript || selectedCall.transcript === 'No transcript available') return;

        setTranslating(true);
        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: selectedCall.transcript,
                    targetLanguage: targetLanguage
                })
            });

            if (!response.ok) throw new Error('Translation failed');

            const data = await response.json();
            setTranslatedTranscript(data.translatedText);
        } catch (err) {
            console.error(err);
            alert('Failed to translate transcript');
        } finally {
            setTranslating(false);
        }
    };

    const handlePlayTranslatedAudio = async () => {
        if (!translatedTranscript) return;

        setGeneratingAudio(true);
        try {
            // Replace the technical labels with natural sounding German labels for the audio
            const audioText = translatedTranscript
                .replace(/^user:\s*/gmi, 'Der Anrufer sagt: ')
                .replace(/^assistant:\s*/gmi, 'Der Agent antwortet: ');

            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: audioText,
                    voice: 'nova'
                })
            });

            if (!response.ok) throw new Error('TTS failed');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setTranslatedAudioUrl(url);
        } catch (err) {
            console.error(err);
            alert('Failed to generate translated audio');
        } finally {
            setGeneratingAudio(false);
        }
    };

    const handleSendEmail = async () => {
        if (!selectedCall) return;

        setSendingEmail(true);
        try {
            const response = await fetch(`/api/calls/${selectedCall.id}/email`, {
                method: 'POST'
            });

            const data = await response.json();

            if (response.ok) {
                alert('Email sent successfully!');
            } else {
                throw new Error(data.error || 'Failed to send email');
            }
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Failed to send email');
        } finally {
            setSendingEmail(false);
        }
    };

    const handleCloseModal = () => {
        setSelectedCall(null);
        setTranslatedTranscript(null);
        setTranslatedAudioUrl(null);
        setGeneratingAudio(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-500 min-h-[400px] flex items-center justify-center">
                {error}
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Call History</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
                {/* Left Column: List of Calls */}
                <div className="lg:col-span-1 overflow-y-auto pr-2 space-y-4 h-full custom-scrollbar">
                    {calls.length === 0 ? (
                        <div className="text-center text-slate-500 py-12 bg-slate-50 rounded-2xl border border-slate-200">
                            <p>No calls found.</p>
                        </div>
                    ) : (
                        calls.map((call) => (
                            <div
                                key={call.id}
                                onClick={() => setSelectedCall(call)}
                                className={`
                                    cursor-pointer rounded-xl p-4 border transition-all duration-200
                                    ${selectedCall?.id === call.id
                                        ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500/50'
                                        : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-slate-900 text-sm">{call.caller}</h3>
                                    <span className="text-[10px] text-slate-500 font-mono">{call.date.split(',')[0]}</span>
                                </div>
                                <p className="text-xs text-slate-600 line-clamp-3 mb-3 leading-relaxed">
                                    {call.transcript || "No transcript available..."}
                                </p>
                                <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-wider">
                                    <span>{call.duration}</span>
                                    <span className={`px-1.5 py-0.5 rounded ${call.status === 'completed' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                        {call.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Right Column: Active Call Details */}
                <div className="lg:col-span-2 glass-card border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-full bg-white">
                    {selectedCall ? (
                        <>
                            {/* Header */}
                            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 mb-1">{selectedCall.caller}</h2>
                                    <p className="text-xs text-slate-500 flex items-center gap-2">
                                        <Clock size={12} /> {selectedCall.duration}
                                        <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                                        <span className="font-mono opacity-50">ID: {selectedCall.id}</span>
                                    </p>
                                </div>
                                {selectedCall.status === 'completed' && (
                                    <button
                                        onClick={handleSendEmail}
                                        disabled={sendingEmail || !selectedCall.transcript || selectedCall.transcript === 'No transcript available'}
                                        className="flex items-center gap-2 text-xs font-bold bg-slate-900 text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                                        title="Email Transcript"
                                    >
                                        {sendingEmail ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                                    </button>
                                )}
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-4 gap-6">
                                <button
                                    onClick={() => setActiveTab('transcript')}
                                    className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'transcript' ? 'text-blue-500 border-blue-500' : 'text-slate-500 border-transparent hover:text-slate-900'}`}
                                >
                                    Transcript
                                </button>
                                <button
                                    onClick={() => setActiveTab('context')}
                                    className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'context' ? 'text-blue-500 border-blue-500' : 'text-slate-500 border-transparent hover:text-slate-900'}`}
                                >
                                    Context
                                </button>
                                <button
                                    onClick={() => setActiveTab('actions')}
                                    className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'actions' ? 'text-blue-500 border-blue-500' : 'text-slate-500 border-transparent hover:text-slate-900'}`}
                                >
                                    Post-Call Actions
                                </button>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
                                {activeTab === 'transcript' && (
                                    <div className="space-y-6 max-w-3xl mx-auto">
                                        {/* Audio Player if available */}
                                        {selectedCall.recordingUrl && (
                                            <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-bold">Call Recording</p>
                                                <audio controls src={selectedCall.recordingUrl} className="w-full h-8" />
                                            </div>
                                        )}

                                        {/* Translation Controls */}
                                        <div className="flex justify-end mb-4">
                                            <div className="flex gap-2 items-center bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                                                {translatedTranscript && !translatedAudioUrl && (
                                                    <button
                                                        onClick={handlePlayTranslatedAudio}
                                                        disabled={generatingAudio}
                                                        className="p-1.5 hover:bg-slate-200 rounded text-purple-600 transition-colors"
                                                        title="Listen to translation"
                                                    >
                                                        {generatingAudio ? <Loader2 size={14} className="animate-spin" /> : <Mic size={14} />}
                                                    </button>
                                                )}

                                                {!translatedTranscript && (
                                                    <>
                                                        <select
                                                            value={targetLanguage}
                                                            onChange={(e) => setTargetLanguage(e.target.value)}
                                                            className="bg-transparent text-[10px] font-bold text-slate-700 focus:outline-none border-r border-slate-300 pr-2 mr-1"
                                                        >
                                                            {languages.map(lang => (
                                                                <option key={lang} value={lang} className="bg-white">{lang}</option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            onClick={handleTranslate}
                                                            disabled={translating}
                                                            className="p-1 hover:bg-slate-200 rounded text-blue-600 transition-colors"
                                                            title="Translate"
                                                        >
                                                            {translating ? <Loader2 size={14} className="animate-spin" /> : <Languages size={14} />}
                                                        </button>
                                                    </>
                                                )}

                                                {translatedTranscript && (
                                                    <button
                                                        onClick={() => setTranslatedTranscript(null)}
                                                        className="text-[10px] font-bold text-slate-500 hover:text-slate-700 px-2"
                                                    >
                                                        Show Original
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Transcript Text */}
                                        {(!selectedCall.transcript || selectedCall.transcript === 'No transcript available') ? (
                                            <div className="text-center text-slate-500 py-12 italic">No transcript available for this call.</div>
                                        ) : (
                                            <div className="space-y-6">
                                                {(translatedTranscript || selectedCall.transcript).split('\n').map((line, index) => {
                                                    const isUser = line.toLowerCase().startsWith('user:');
                                                    const content = line.replace(/^(user|assistant):\s*/i, '').trim();

                                                    if (!content) return null;

                                                    return (
                                                        <div key={index} className="flex gap-4 group">
                                                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${isUser ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                                                {isUser ? 'U' : 'A'}
                                                            </div>
                                                            <div className="flex-1 pt-1">
                                                                <div className="flex items-baseline gap-2 mb-1">
                                                                    <span className={`text-xs font-bold ${isUser ? 'text-blue-600' : 'text-slate-900'}`}>
                                                                        {isUser ? 'User' : 'Assistant'}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">00:{index < 10 ? `0${index}` : index}</span>
                                                                </div>
                                                                <p className="text-sm leading-relaxed text-slate-700">
                                                                    {content}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'context' && (
                                    <div className="flex items-center justify-center h-full text-slate-500 italic">
                                        Context analysis coming soon...
                                    </div>
                                )}

                                {activeTab === 'actions' && (
                                    <div className="space-y-4 max-w-3xl mx-auto">
                                        {fetchingAgent ? (
                                            <div className="flex items-center justify-center py-12">
                                                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                            </div>
                                        ) : selectedAgent?.sendEmailAfterCall ? (
                                            <div className="space-y-3">
                                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-500 border border-slate-200 shadow-sm">
                                                            <Mail size={20} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-sm font-bold text-slate-900">Mail Action: Tool has been started</h3>
                                                            <p className="text-xs text-slate-500">Email has been sent to {selectedAgent.transcriptionEmail}</p>
                                                        </div>
                                                    </div>
                                                    <div className="px-2 py-1 bg-green-500/10 text-green-600 text-[10px] font-bold rounded uppercase">
                                                        Completed
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center py-20 text-slate-500 italic">
                                                No post-call actions configured for this agent.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 p-12 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <PhoneIncoming size={32} className="opacity-50 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Select a call to view details</h3>
                            <p className="max-w-xs text-sm">Choose a conversation from the list on the left to review the transcript and details.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function CallsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        }>
            <CallsList />
        </Suspense>
    );
}

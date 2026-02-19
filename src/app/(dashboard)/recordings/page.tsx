"use client";

import { Mic, Clock, Clipboard, Loader2, Languages } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Call {
    id: string;
    type: 'incoming' | 'outgoing';
    caller: string;
    agent: string;
    duration: string;
    date: string;
    status: string;
    transcript: string;
    recordingUrl?: string | null;
}

export default function RecordingsPage() {
    const [calls, setCalls] = useState<Call[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCall, setSelectedCall] = useState<Call | null>(null);
    const [translating, setTranslating] = useState(false);
    const [translatedTranscript, setTranslatedTranscript] = useState<string | null>(null);
    const [translatedAudioUrl, setTranslatedAudioUrl] = useState<string | null>(null);
    const [generatingAudio, setGeneratingAudio] = useState(false);

    useEffect(() => {
        const fetchCalls = async () => {
            try {
                const response = await fetch('/api/calls');
                if (!response.ok) {
                    throw new Error('Failed to fetch calls');
                }
                const data = await response.json();
                // Filter for calls with recordings
                const recordedCalls = data.filter((call: Call) => call.recordingUrl);
                setCalls(recordedCalls);
            } catch (err) {
                console.error(err);
                setError('Failed to load recordings');
            } finally {
                setLoading(false);
            }
        };

        fetchCalls();
    }, []);

    const handleTranslate = async () => {
        if (!selectedCall || !selectedCall.transcript) return;

        setTranslating(true);
        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: selectedCall.transcript,
                    targetLanguage: 'German'
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
        <div className="space-y-8 relative">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Call Recordings</h1>
                <p className="text-slate-400">Listen to and analyze recorded conversations with AI agents.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {calls.length === 0 ? (
                    <div className="text-center text-slate-500 py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
                        <Mic className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No recorded calls found.</p>
                    </div>
                ) : (
                    calls.map((call) => (
                        <div key={call.id} className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition-all">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex gap-4 min-w-[300px]">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-400">
                                        <Mic size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{call.caller}</h3>
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                            <Clock size={12} /> {call.date} • {call.duration}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">To Agent:</span>
                                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">{call.agent}</span>
                                    </div>
                                    <p className="text-sm text-slate-400 line-clamp-2 italic border-l-2 border-slate-700 pl-4 py-1">
                                        "{call.transcript}"
                                    </p>
                                </div>

                                <div className="flex flex-row md:flex-col justify-between items-end gap-2">
                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400">
                                        recorded
                                    </span>
                                    <button
                                        onClick={() => setSelectedCall(call)}
                                        className="flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        <Clipboard size={14} />
                                        Review Recording
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {selectedCall && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Call Details</h3>
                            <button
                                onClick={handleCloseModal}
                                className="text-slate-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            <div className="mb-6">
                                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1 font-bold">Participants</p>
                                <p className="text-white font-medium">{selectedCall.caller} <span className="text-slate-500 mx-2">➜</span> {selectedCall.agent}</p>
                            </div>

                            <div className="mb-6">
                                <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-bold">Audio Recording</p>
                                <audio controls src={selectedCall.recordingUrl!} className="w-full h-10 mt-1" />
                            </div>

                            {translatedAudioUrl && (
                                <div className="mb-6 p-4 bg-blue-600/5 rounded-xl border border-blue-600/10">
                                    <p className="text-xs text-blue-400 uppercase tracking-widest mb-2 font-bold">Translated Audio (German)</p>
                                    <audio controls src={translatedAudioUrl} autoPlay className="w-full h-10 mt-1" />
                                </div>
                            )}

                            <div className="relative">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Transcript</p>
                                    <div className="flex gap-2">
                                        {translatedTranscript && !translatedAudioUrl && (
                                            <button
                                                onClick={handlePlayTranslatedAudio}
                                                disabled={generatingAudio}
                                                className="flex items-center gap-1.5 text-[10px] font-bold bg-purple-600/10 text-purple-400 px-2 py-1 rounded-lg hover:bg-purple-600/20 transition-all border border-purple-600/20 disabled:opacity-50"
                                            >
                                                {generatingAudio ? <Loader2 size={12} className="animate-spin" /> : <Mic size={12} />}
                                                {generatingAudio ? 'GENERATING VOICE...' : 'LISTEN IN GERMAN'}
                                            </button>
                                        )}
                                        {!translatedTranscript && (
                                            <button
                                                onClick={handleTranslate}
                                                disabled={translating}
                                                className="flex items-center gap-1.5 text-[10px] font-bold bg-blue-600/10 text-blue-400 px-2 py-1 rounded-lg hover:bg-blue-600/20 transition-all border border-blue-600/20 disabled:opacity-50"
                                            >
                                                {translating ? <Loader2 size={12} className="animate-spin" /> : <Languages size={12} />}
                                                {translating ? 'TRANSLATING...' : 'TRANSLATE TO GERMAN'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {(translatedTranscript || selectedCall.transcript).split('\n').map((line, index) => {
                                        const isUser = line.toLowerCase().startsWith('user:');
                                        const content = line.replace(/^(user|assistant):\s*/i, '');

                                        if (!content) return null;

                                        return (
                                            <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`
                                                    max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                                                    ${isUser
                                                        ? 'bg-blue-600 text-white rounded-tr-sm shadow-lg shadow-blue-500/10'
                                                        : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700 shadow-xl'}
                                                `}>
                                                    <p className="font-bold text-[9px] mb-1 opacity-50 uppercase tracking-widest">
                                                        {isUser ? 'User' : 'Assistant'}
                                                    </p>
                                                    {content}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {translatedTranscript && (
                                    <div className="mt-4 text-center">
                                        <button
                                            onClick={() => setTranslatedTranscript(null)}
                                            className="text-[10px] font-bold text-slate-500 hover:text-slate-400 underline underline-offset-4"
                                        >
                                            Show Original Transcript
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import { X, Check, Play, Globe } from 'lucide-react';
import { VOICE_OPTIONS } from '@/lib/voice-options';
import { useState } from 'react';

interface VoiceSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (voiceId: string) => void;
    currentVoice: string;
}

export default function VoiceSelectorModal({ isOpen, onClose, onSelect, currentVoice }: VoiceSelectorModalProps) {
    const [selectedId, setSelectedId] = useState<string>(currentVoice);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSave = () => {
        if (audio) {
            audio.pause();
            setAudio(null);
        }
        onSelect(selectedId);
        onClose();
    };

    const handlePlay = (e: React.MouseEvent, voice: any) => {
        e.stopPropagation(); // Prevent selecting the voice row

        if (playingId === voice.id) {
            // Stop playing
            if (audio) {
                audio.pause();
                setAudio(null);
            }
            setPlayingId(null);
            return;
        }

        // Stop previous
        if (audio) {
            audio.pause();
        }

        setPlayingId(voice.id);
        setError(null);

        // Use the nativeId for OpenAI TTS (e.g. map 'james' -> 'onyx')
        const previewUrl = `/api/voice/preview?voice=${voice.nativeId}&text=Hello, I am ${voice.name}. Nice to meet you.`;

        const newAudio = new Audio(previewUrl);
        newAudio.onended = () => setPlayingId(null);
        newAudio.onerror = () => {
            console.error('Failed to play preview');
            setPlayingId(null);
            setError('Failed to play voice preview. Please check your API usage.');
        };

        // Handle the "The play() request was interrupted by a call to pause()" error
        newAudio.play().catch(async (err) => {
            if (err.name !== 'AbortError') {
                console.error("Audio play failed:", err);

                // If it was a loading error (e.g. 503 from backend), capture it if we can
                // Since Audio() doesn't give response body easily, we rely on onerror above or just assume network issue
                setPlayingId(null);
                setError('Failed to load voice. Your AI quota might be exceeded.');
            }
        });

        setAudio(newAudio);
    };

    const getFlag = (accent: string) => {
        switch (accent) {
            case 'British': return '🇬🇧';
            case 'US': return '🇺🇸';
            case 'Multilingual': return '🌍';
            default: return '🏳️';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Select Voice</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 px-6 py-3 text-sm font-medium border-b border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {VOICE_OPTIONS.map((voice) => {
                        const isSelected = selectedId === voice.id || (selectedId === voice.nativeId && voice.provider === 'openai');
                        const isPlaying = playingId === voice.id;

                        return (
                            <div
                                key={voice.id}
                                onClick={() => setSelectedId(voice.id)}
                                className={`flex items-center gap-4 p-4 mx-4 rounded-xl cursor-pointer transition-all border ${isSelected
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'hover:bg-gray-50 border-transparent'
                                    }`}
                            >
                                {/* Play Button */}
                                <button
                                    type="button"
                                    onClick={(e) => handlePlay(e, voice)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPlaying
                                        ? 'bg-blue-600 text-white scale-110 shadow-md'
                                        : 'bg-slate-900 text-white hover:bg-slate-700'
                                        }`}
                                >
                                    {isPlaying ? (
                                        <div className="flex gap-0.5 items-center h-3">
                                            <span className="w-0.5 h-full bg-white animate-[bounce_1s_infinite] delay-0"></span>
                                            <span className="w-0.5 h-full bg-white animate-[bounce_1s_infinite] delay-100"></span>
                                            <span className="w-0.5 h-full bg-white animate-[bounce_1s_infinite] delay-200"></span>
                                        </div>
                                    ) : (
                                        <Play size={14} fill="currentColor" />
                                    )}
                                </button>

                                {/* Avatar Placeholder using Name Initials */}
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                    {voice.name[0]}
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 text-base">
                                        {voice.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            {getFlag(voice.accent)} {voice.accent}
                                        </span>
                                        {voice.tags.map(tag => (
                                            <span key={tag} className="text-xs text-gray-400">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-gray-200'
                                    }`}>
                                    {isSelected && <Check size={14} className="text-white" />}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-5 py-2.5 rounded-xl font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

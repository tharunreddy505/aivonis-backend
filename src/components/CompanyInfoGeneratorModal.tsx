'use client';

import { useState } from 'react';
import { X, Loader2, Wand2 } from 'lucide-react';

interface CompanyInfoGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (info: string) => void;
}

export default function CompanyInfoGeneratorModal({ isOpen, onClose, onGenerate }: CompanyInfoGeneratorModalProps) {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!url) {
            setError('Please enter a website URL');
            return;
        }

        // Basic URL validation
        let validUrl = url;
        if (!url.startsWith('http')) {
            validUrl = `https://${url}`;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/generate-company-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: validUrl }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to generate info');
            }

            const data = await response.json();
            onGenerate(data.info);
            onClose();
            setUrl(''); // Reset
        } catch (err: any) {
            console.error('Error generating company info:', err);
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900">Automatically adopt company information</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 p-2 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Company Website</label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://mycompany.com"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        />
                        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !url}
                            className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-slate-900/10"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Scanning...
                                </>
                            ) : (
                                <>
                                    Generate company info
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

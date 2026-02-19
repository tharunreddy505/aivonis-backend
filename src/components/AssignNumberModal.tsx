'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw, Phone, Globe, Loader2, Check } from 'lucide-react';
import type { Agent } from '@/lib/agents';

interface AssignNumberModalProps {
    agent: Agent;
    isOpen: boolean;
    onClose: () => void;
    onAssign: (phoneNumber: string) => void;
}

interface TwilioNumber {
    phoneNumber: string;
    friendlyName: string;
    isoCountry: string;
    locality: string;
    region: string;
}

const COUNTRIES = [
    { code: 'US', name: 'United States', price: '$1.15' },
    { code: 'GB', name: 'United Kingdom', price: '$1.15' },
    { code: 'CA', name: 'Canada', price: '$1.15' },
    { code: 'DE', name: 'Germany', price: '$1.15' },
    { code: 'FR', name: 'France', price: '$1.15' },
];

export default function AssignNumberModal({ agent, isOpen, onClose, onAssign }: AssignNumberModalProps) {
    const [step, setStep] = useState<'initial' | 'search' | 'confirm'>('initial');
    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0].code);
    const [availableNumbers, setAvailableNumbers] = useState<TwilioNumber[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedNumber, setSelectedNumber] = useState<TwilioNumber | null>(null);
    const [buying, setBuying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setStep('initial');
            setAvailableNumbers([]);
            setSelectedNumber(null);
            setError(null);
        }
    }, [isOpen]);

    const handleSearch = async (countryCode: string) => {
        setLoading(true);
        setError(null);
        setSelectedCountry(countryCode);
        setStep('search');
        try {
            const res = await fetch(`/api/twilio/search?country=${countryCode}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setAvailableNumbers(data.numbers || []);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch numbers');
        } finally {
            setLoading(false);
        }
    };

    const handleBuy = async () => {
        if (!selectedNumber) return;
        setBuying(true);
        setError(null);
        try {
            const res = await fetch('/api/twilio/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber: selectedNumber.phoneNumber,
                    agentId: agent.id
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            onAssign(data.phoneNumber);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to buy number');
            setBuying(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900">Assign Number</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-900 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Step: Initial / Country Selection */}
                    {step === 'initial' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <p className="text-sm text-blue-800">
                                    ⓘ Phone numbers are purchased directly from Twilio.
                                    Costs are approximately $1.15/month per number.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Select Country</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {COUNTRIES.map((country) => (
                                        <button
                                            key={country.code}
                                            onClick={() => handleSearch(country.code)}
                                            className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-blue-300 transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-lg shadow-sm">
                                                    {country.code === 'US' ? '🇺🇸' :
                                                        country.code === 'GB' ? '🇬🇧' :
                                                            country.code === 'CA' ? '🇨🇦' :
                                                                country.code === 'DE' ? '🇩🇪' :
                                                                    '🇫🇷'}
                                                </div>
                                                <span className="font-medium text-slate-700 group-hover:text-slate-900">{country.name}</span>
                                            </div>
                                            <span className="text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded text-slate-500">{country.price}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step: Select Number */}
                    {step === 'search' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <button onClick={() => setStep('initial')} className="text-sm text-blue-500 hover:text-blue-700 font-medium">
                                    ← Back to Countries
                                </button>
                                {loading && <Loader2 className="animate-spin text-blue-500" size={18} />}
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {!loading && availableNumbers.length === 0 && !error && (
                                <p className="text-center text-slate-500 py-8">No numbers found.</p>
                            )}

                            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {availableNumbers.map((num) => (
                                    <button
                                        key={num.phoneNumber}
                                        onClick={() => setSelectedNumber(num)}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${selectedNumber?.phoneNumber === num.phoneNumber
                                            ? 'bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-500/50'
                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-blue-300'
                                            }`}
                                    >
                                        <div className="flex flex-col items-start">
                                            <span className="font-mono font-bold text-lg">{num.phoneNumber}</span>
                                            <span className="text-xs text-slate-500">{num.locality || num.region || 'National'}</span>
                                        </div>
                                        {selectedNumber?.phoneNumber === num.phoneNumber && (
                                            <Check size={18} className="text-blue-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all"
                    >
                        Cancel
                    </button>
                    {step === 'search' && (
                        <button
                            onClick={handleBuy}
                            disabled={!selectedNumber || buying}
                            className="px-6 py-2 rounded-lg text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {buying ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Buying...
                                </>
                            ) : (
                                "Buy Number"
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

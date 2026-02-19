'use client';

import { useState, useEffect } from 'react';
import { Database, HelpCircle, Loader2, CheckCircle2, Save } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated') {
            if (session?.user?.role !== 'admin') {
                router.push('/');
            }
        } else if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, session, router]);

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        openaiApiKey: '',
        twilioAccountSid: '',
        twilioAuthToken: '',
        smtpHost: '',
        smtpPort: '',
        smtpUser: '',
        smtpPassword: '',
        smtpSecure: true,
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings');
                if (response.ok) {
                    const data = await response.json();
                    setFormData({
                        openaiApiKey: data.openaiApiKey || '',
                        twilioAccountSid: data.twilioAccountSid || '',
                        twilioAuthToken: data.twilioAuthToken || '',
                        smtpHost: data.smtpHost || '',
                        smtpPort: data.smtpPort || '',
                        smtpUser: data.smtpUser || '',
                        smtpPassword: data.smtpPassword || '',
                        smtpSecure: data.smtpSecure !== false,
                    });
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            } finally {
                setFetching(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        setSuccess(false);
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                alert('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('An error occurred while saving settings');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                <p className="text-slate-400">Configure your API keys and global application settings.</p>
            </div>

            <div className="max-w-2xl space-y-6">
                <div className="glass-card rounded-2xl p-8 border border-slate-800">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Database size={20} className="text-blue-500" />
                        Integration Keys
                    </h2>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">OpenAI API Key</label>
                            <input
                                type="password"
                                name="openaiApiKey"
                                value={formData.openaiApiKey}
                                onChange={handleChange}
                                placeholder="sk-..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                            />
                            <p className="text-[10px] text-slate-500">Needed for agent intelligence and voice generation.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Twilio Account SID</label>
                            <input
                                type="text"
                                name="twilioAccountSid"
                                value={formData.twilioAccountSid}
                                onChange={handleChange}
                                placeholder="AC..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Twilio Auth Token</label>
                            <input
                                type="password"
                                name="twilioAuthToken"
                                value={formData.twilioAuthToken}
                                onChange={handleChange}
                                placeholder="••••••••••••••••"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                            />
                        </div>
                    </div>
                </div>

                <div className="glass-card rounded-2xl p-8 border border-slate-800">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Database size={20} className="text-green-500" />
                        Email Configuration
                    </h2>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">SMTP Host</label>
                                <input
                                    type="text"
                                    name="smtpHost"
                                    value={formData.smtpHost}
                                    onChange={handleChange}
                                    placeholder="smtp.example.com"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400">SMTP Port</label>
                                <input
                                    type="number"
                                    name="smtpPort"
                                    value={formData.smtpPort}
                                    onChange={handleChange}
                                    placeholder="587"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="smtpSecure"
                                    checked={formData.smtpSecure}
                                    onChange={(e) => setFormData(prev => ({ ...prev, smtpSecure: e.target.checked }))}
                                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                                />
                                <span className="text-sm text-slate-400">Secure Connection (SSL/TLS)</span>
                            </label>
                            <span className="text-[10px] text-slate-500">(Uncheck for port 587 with STARTTLS)</span>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">SMTP User</label>
                            <input
                                type="text"
                                name="smtpUser"
                                value={formData.smtpUser}
                                onChange={handleChange}
                                placeholder="user@example.com"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">SMTP Password</label>
                            <input
                                type="password"
                                name="smtpPassword"
                                value={formData.smtpPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                            />
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className={`w-full py-3 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${success ? 'bg-green-600 shadow-green-500/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'} disabled:opacity-50 text-white`}
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : success ? (
                                <>
                                    <CheckCircle2 size={18} />
                                    Settings Saved
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Configuration
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="glass-card rounded-2xl p-6 border border-slate-800 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                        <HelpCircle size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-200">Need help?</h3>
                        <p className="text-xs text-slate-500">Check our documentation on how to set up webhooks.</p>
                    </div>
                    <button className="ml-auto text-xs font-bold text-blue-400 hover:underline">Documentation</button>
                </div>
            </div>
        </div>
    );
}

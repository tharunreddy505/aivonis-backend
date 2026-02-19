'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ChevronLeft, Mic, User, FileText, CheckCircle2, Loader2, Phone } from 'lucide-react';
import Link from 'next/link';
import PromptTemplateModal from '@/components/PromptTemplateModal';
import VoiceSelectorModal from '@/components/VoiceSelectorModal';
import TestCallModal from '@/components/TestCallModal';
import { VOICE_OPTIONS } from '@/lib/voice-options';
import CompanyInfoGeneratorModal from '@/components/CompanyInfoGeneratorModal';
import { X, FileText as FileIcon } from 'lucide-react';
import ToolsSection from '@/components/ToolsSection';
import UploadDocumentModal from '@/components/UploadDocumentModal';

export default function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [fetching, setFetching] = useState(true);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showVoiceModal, setShowVoiceModal] = useState(false);
    const [showTestCall, setShowTestCall] = useState(false);
    const [showCompanyGenModal, setShowCompanyGenModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [globalDocuments, setGlobalDocuments] = useState<{ id: string; name: string; url: string; size: number }[]>([]);
    const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(new Set());
    const [tools, setTools] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        prompt: '',
        firstSentence: '',
        gender: 'female',
        voice: 'shimmer',
        userEmail: '',
        userPassword: '',
        userName: '',
        transcriptionEmail: '',
        sendEmailAfterCall: false,
        maxCallDuration: 20,
        maxWaitTime: 10,
        companyInfo: ''
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch global docs
                const docsRes = await fetch('/api/documents');
                if (docsRes.ok) {
                    const docs = await docsRes.json();
                    setGlobalDocuments(docs);
                }

                // Fetch Agent
                const response = await fetch(`/api/agents/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setFormData({
                        name: data.name,
                        prompt: data.prompt,
                        firstSentence: data.firstSentence || '',
                        gender: data.gender,
                        voice: data.voice,
                        userEmail: '',
                        userPassword: '',
                        userName: '',
                        transcriptionEmail: data.transcriptionEmail || '',
                        sendEmailAfterCall: data.sendEmailAfterCall || false,
                        maxCallDuration: data.maxCallDuration || 20,
                        maxWaitTime: data.maxWaitTime || 10,
                        companyInfo: data.companyInfo || ''
                    });

                    if (data.documents) {
                        setSelectedDocumentIds(new Set(data.documents.map((d: any) => d.id)));
                    }

                    if (data.tools) {
                        setTools(data.tools);
                    }
                } else {
                    alert('Agent not found');
                    router.push('/agents');
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setFetching(false);
            }
        };
        loadData();
    }, [id, router]);

    const toggleDocument = (id: string) => {
        const newSet = new Set(selectedDocumentIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedDocumentIds(newSet);
    };

    const handleNewUpload = (doc: any) => {
        setGlobalDocuments(prev => [doc, ...prev]);
        setSelectedDocumentIds(prev => new Set(prev).add(doc.id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`/api/agents/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    documentIds: Array.from(selectedDocumentIds),
                    tools
                }),
            });

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => router.push('/agents'), 1500);
            } else {
                const data = await response.json();
                alert(`Failed to update agent: ${data.error || response.statusText}`);
            }
        } catch (error) {
            console.error('Error updating agent:', error);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/agents" className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-1">Edit AI Agent</h1>
                    <p className="text-slate-500 text-sm">Update the personality and voice of your assistant.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="glass-card rounded-2xl p-8 border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <User size={18} className="text-blue-500" />
                        General Information
                    </h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Agent Name</label>
                            <input
                                required
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Maria (Receptionist)"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Personality/Prompt */}
                <div className="glass-card rounded-2xl p-8 border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <FileText size={18} className="text-purple-500" />
                            Agent Personality
                        </h2>
                        <button
                            type="button"
                            onClick={() => setShowTemplateModal(true)}
                            className="text-xs font-medium text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                        >
                            <span className="text-lg">✨</span>
                            Browse Templates
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">System Instructions (Prompt)</label>
                            <textarea
                                required
                                rows={6}
                                name="prompt"
                                value={formData.prompt}
                                onChange={handleChange}
                                placeholder="Explain who the agent is and how they should behave. (e.g. 'You are a warm receptionist for a dental clinic...')"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm resize-none"
                            ></textarea>
                            <p className="text-[10px] text-slate-500">The more detail you provide, the better the AI will perform.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Start Message</label>
                            <input
                                type="text"
                                name="firstSentence"
                                value={formData.firstSentence}
                                onChange={handleChange}
                                placeholder="Hello! How can I help you today?"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
                            />
                            <p className="text-[10px] text-slate-500">
                                This is the fixed message sent at the beginning of the conversation. Keep it short so the caller knows they are connected.
                            </p>
                        </div>
                    </div>
                </div>

                <PromptTemplateModal
                    isOpen={showTemplateModal}
                    onClose={() => setShowTemplateModal(false)}
                    onSelect={(prompt) => setFormData(prev => ({ ...prev, prompt }))}
                />

                {/* Company Information */}
                <div className="glass-card rounded-2xl p-8 border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            Company Information
                        </h2>
                        <button
                            type="button"
                            onClick={() => setShowCompanyGenModal(true)}
                            className="text-xs font-medium text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                        >
                            <span className="text-lg">✨</span>
                            Automatically fill company info
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <textarea
                                rows={6}
                                name="companyInfo"
                                value={formData.companyInfo}
                                onChange={handleChange}
                                placeholder="Info about your company, opening hours, frequently asked questions,..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm resize-none"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Additional Documents */}
                <div className="glass-card rounded-2xl p-8 border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <FileIcon size={18} className="text-orange-400" />
                            Additional Documents
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-slate-500">
                            Select documents from the Knowledge Base for the agent to use.
                        </p>

                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {globalDocuments.map((doc) => (
                                <label key={doc.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedDocumentIds.has(doc.id)}
                                            onChange={() => toggleDocument(doc.id)}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                                            <p className="text-xs text-slate-500">{(doc.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <FileText size={16} className="text-slate-400" />
                                </label>
                            ))}

                            {globalDocuments.length === 0 && (
                                <p className="text-xs text-slate-500 italic p-2">No documents found in Knowledge Base.</p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowUploadModal(true)}
                            className="text-sm text-blue-500 hover:text-blue-600 font-medium hover:underline inline-block"
                        >
                            + Upload additional document
                        </button>
                    </div>
                </div>

                {/* Tools & Capabilities */}
                <ToolsSection tools={tools} onUpdate={setTools} />

                <UploadDocumentModal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    onUpload={handleNewUpload}
                />

                <CompanyInfoGeneratorModal
                    isOpen={showCompanyGenModal}
                    onClose={() => setShowCompanyGenModal(false)}
                    onGenerate={(info) => setFormData(prev => ({ ...prev, companyInfo: info }))}
                />

                {/* Voice Selection */}
                <div className="glass-card rounded-2xl p-8 border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Mic size={18} className="text-green-500" />
                        Voice Configuration
                    </h2>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-slate-700">Voice Preset</label>
                        <div
                            onClick={() => setShowVoiceModal(true)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 cursor-pointer hover:border-blue-500/50 transition-all flex items-center justify-between group shadow-sm"
                        >
                            <span className="capitalize">
                                {VOICE_OPTIONS.find(v => v.id === formData.voice || v.nativeId === formData.voice)?.name || formData.voice}
                                <span className="text-slate-500 ml-2 text-xs">
                                    ({VOICE_OPTIONS.find(v => v.id === formData.voice || v.nativeId === formData.voice)?.accent || 'Standard'})
                                </span>
                            </span>
                            <span className="text-slate-500 group-hover:text-slate-900 transition-colors">Change</span>
                        </div>
                    </div>
                </div>

                <VoiceSelectorModal
                    isOpen={showVoiceModal}
                    onClose={() => setShowVoiceModal(false)}
                    currentVoice={formData.voice}
                    onSelect={(voiceId) => {
                        const voice = VOICE_OPTIONS.find(v => v.id === voiceId);
                        if (voice) {
                            setFormData(prev => ({
                                ...prev,
                                voice: voice.nativeId, // Use the mapped native ID logic
                                gender: voice.gender
                            }));
                        }
                    }}
                />

                {/* Call Settings */}
                <div className="glass-card rounded-2xl p-8 border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <span className="text-2xl">⚙️</span>
                        Call Settings
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Maximum Call Duration</label>
                            <p className="text-[10px] text-slate-500 mb-2">
                                After this time (in minutes), the call is automatically ended
                            </p>
                            <input
                                type="number"
                                name="maxCallDuration"
                                value={formData.maxCallDuration}
                                onChange={handleChange}
                                min={1}
                                max={60}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Maximum Wait Time</label>
                            <p className="text-[10px] text-slate-500 mb-2">
                                After this time (in seconds) without a response, the call is ended
                            </p>
                            <input
                                type="number"
                                name="maxWaitTime"
                                value={formData.maxWaitTime}
                                onChange={handleChange}
                                min={5}
                                max={60}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Email Notifications */}
                <div className="glass-card rounded-2xl p-8 border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <span className="text-2xl">📧</span>
                            Email Notifications
                        </h2>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="sendEmailAfterCall"
                                checked={formData.sendEmailAfterCall}
                                onChange={(e) => setFormData(prev => ({ ...prev, sendEmailAfterCall: e.target.checked }))}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                            />
                            <span className="text-sm text-slate-500">Send transcript after call</span>
                        </label>
                    </div>

                    {formData.sendEmailAfterCall && (
                        <div className="space-y-4 pt-4 border-t border-slate-200">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Recipient Email</label>
                                <input
                                    required={formData.sendEmailAfterCall}
                                    type="email"
                                    name="transcriptionEmail"
                                    value={formData.transcriptionEmail}
                                    onChange={handleChange}
                                    placeholder="manager@company.com"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
                                />
                                <p className="text-[10px] text-slate-500">
                                    Call transcripts and details will be sent to this address immediately after the call ends.
                                    Ensure SMTP settings are configured in global Settings.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit */}
                <div className="flex justify-between items-center pt-6 border-t border-slate-200">
                    <button
                        type="button"
                        onClick={() => setShowTestCall(true)}
                        className="px-6 py-3 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-900 transition-all flex items-center gap-2"
                    >
                        <span className="text-xl">🎧</span>
                        Test Audio
                    </button>

                    <div className="flex gap-4">
                        <Link href="/agents" className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading || success}
                            className={`flex items-center gap-2 px-10 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-lg ${success ? 'bg-green-600 shadow-green-500/20' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'} disabled:opacity-50`}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </span>
                            ) : success ? (
                                <span className="flex items-center gap-2">
                                    <CheckCircle2 size={18} />
                                    Changes Saved!
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Save size={18} />
                                    Save Changes
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            <TestCallModal
                isOpen={showTestCall}
                onClose={() => setShowTestCall(false)}
                agentName={formData.name || 'Agent'}
                agentPrompt={formData.prompt}
                agentFirstSentence={formData.firstSentence}
                agentVoice={formData.voice}
            />
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, Search, Loader2 } from 'lucide-react';
import UploadDocumentModal from '@/components/UploadDocumentModal';

export default function KnowledgeBasePage() {
    const [documents, setDocuments] = useState<{ id: string; name: string; url: string; size: number; createdAt: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await fetch('/api/documents');
            if (response.ok) {
                const data = await response.json();
                setDocuments(data);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            const response = await fetch(`/api/documents/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setDocuments(prev => prev.filter(d => d.id !== id));
            } else {
                alert('Failed to delete document');
            }
        } catch (error) {
            console.error('Error deleting document:', error);
            alert('An error occurred while deleting the document');
        }
    };

    const filteredDocuments = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Knowledge Base</h1>
                    <p className="text-slate-500">Manage documents used by your AI agents.</p>
                </div>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-2 transition-colors font-medium"
                >
                    <Upload size={18} />
                    Add Document
                </button>
            </div>

            <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                ) : filteredDocuments.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        {searchTerm ? 'No documents found matching your search.' : 'No documents found. Upload one to get started.'}
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200">
                        {filteredDocuments.map((doc) => (
                            <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-900 font-medium">{doc.name}</h3>
                                        <p className="text-xs text-slate-500">
                                            {(doc.size / 1024 / 1024).toFixed(2)} MB • Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => window.open(doc.url, '_blank')}
                                        className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                                        title="View"
                                    >
                                        <FileText size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <UploadDocumentModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onUpload={(newDoc) => {
                    // Refresh or add to list
                    fetchDocuments();
                }}
            />
        </div>
    );
}

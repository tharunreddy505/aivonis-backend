'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface UploadDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (document: any) => void;
}

export default function UploadDocumentModal({ isOpen, onClose, onUpload }: UploadDocumentModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [documentName, setDocumentName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 20 * 1024 * 1024) { // 20MB
                setError('File size must be less than 20MB');
                return;
            }
            if (selectedFile.type !== 'application/pdf') {
                setError('Only PDF files are allowed');
                return;
            }
            setFile(selectedFile);
            setDocumentName(selectedFile.name.replace('.pdf', ''));
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!file || !documentName) return;

        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', documentName);

        try {
            const response = await fetch('/api/documents', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Upload failed');
            }

            const data = await response.json();
            onUpload(data);
            onClose();
            setFile(null);
            setDocumentName('');
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900">Upload Document</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 p-2 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Document name</label>
                        <input
                            type="text"
                            value={documentName}
                            onChange={(e) => setDocumentName(e.target.value)}
                            placeholder="e.g. Protocol Guidelines"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h4 className="text-orange-500 font-bold text-sm mb-2">Important:</h4>
                        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                            <li>The maximum file size is 20 MB.</li>
                            <li>Currently, only PDF files can be uploaded.</li>
                            <li>The text in the PDF must be copyable – pure image files (scanned documents) will not be processed.</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <input
                            type="file"
                            accept="application/pdf"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {!file ? (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-32 border-2 border-dashed border-slate-300 hover:border-blue-500/50 hover:bg-slate-50 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group"
                            >
                                <Upload className="text-slate-400 group-hover:text-blue-500 transition-colors" size={24} />
                                <span className="text-sm text-slate-500 group-hover:text-blue-600 font-medium">Select Document</span>
                            </button>
                        ) : (
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                                        <FileText size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-900 truncate max-w-[200px]">{file.name}</span>
                                        <span className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    className="text-slate-400 hover:text-red-500 p-2 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-xs mt-2">
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleUpload}
                            disabled={uploading || !file || !documentName}
                            className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-slate-900/10"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    Upload Document
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { X, Check } from 'lucide-react';
import { PROMPT_TEMPLATES } from '@/lib/prompt-templates';
import { useState } from 'react';

interface PromptTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (prompt: string) => void;
}

export default function PromptTemplateModal({ isOpen, onClose, onSelect }: PromptTemplateModalProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSave = () => {
        if (selectedId) {
            const template = PROMPT_TEMPLATES.find(t => t.id === selectedId);
            if (template) {
                onSelect(template.prompt);
            }
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Select Template</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {PROMPT_TEMPLATES.map((template) => {
                        const Icon = template.icon;
                        const isSelected = selectedId === template.id;

                        return (
                            <div
                                key={template.id}
                                onClick={() => setSelectedId(template.id)}
                                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-transparent hover:bg-gray-50'
                                    }`}
                            >
                                <div className={`p-3 rounded-xl ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                    <Icon size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-bold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                        {template.name}
                                    </h3>
                                    <p className={`text-sm mt-1 ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                                        {template.description}
                                    </p>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 transition-colors ${isSelected
                                        ? 'border-blue-500 bg-blue-500'
                                        : 'border-gray-300'
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
                        disabled={!selectedId}
                        className="px-5 py-2.5 rounded-xl font-semibold text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

import { useState, useRef, useEffect } from 'react';
import { Settings, Plus, Phone, Trash2, Edit, Save, X, Settings2, Calendar, Search, Code } from 'lucide-react';
import ToolModal from './ToolModal';

export default function ToolsSection({ tools, onUpdate }: { tools: any[], onUpdate: (newTools: any[]) => void }) {
    const [showModal, setShowModal] = useState(false);
    const [editingTool, setEditingTool] = useState<any>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedToolType, setSelectedToolType] = useState<string>('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddToolClick = () => {
        setShowDropdown(!showDropdown);
    };

    const handleSelectToolType = (type: string) => {
        setSelectedToolType(type);
        setEditingTool(null);
        setShowDropdown(false);
        setShowModal(true);
    };

    return (
        <div className="glass-card rounded-2xl p-8 border border-slate-200">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Settings size={18} className="text-blue-500" />
                    Tools & Capabilities
                </h2>
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={handleAddToolClick}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-slate-900/20"
                    >
                        <Plus size={16} />
                        Add Tool
                    </button>

                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <button
                                type="button"
                                onClick={() => handleSelectToolType('transfer')}
                                className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2"
                            >
                                <Phone size={14} />
                                Call Transfer
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSelectToolType('calcom')}
                                className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2"
                            >
                                <Calendar size={14} />
                                Appointment Booking
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSelectToolType('search')}
                                className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2"
                            >
                                <Search size={14} />
                                Search Request
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSelectToolType('api')}
                                className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2"
                            >
                                <Code size={14} />
                                API Request
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {tools.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                        <p className="text-slate-500 text-sm">No tools configured for this agent yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {tools.map((tool) => (
                            <div key={tool.id} className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between group hover:border-slate-300 transition-all shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-blue-500 border border-slate-200">
                                        {tool.type === 'transfer' ? <Phone size={20} /> :
                                            tool.type === 'calcom' ? <Calendar size={20} /> :
                                                tool.type === 'search' ? <Search size={20} /> :
                                                    <Settings2 size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">{tool.name}</h3>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{tool.type}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(tool)}
                                        className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(tool.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <ToolModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                    initialData={editingTool}
                    toolType={selectedToolType || editingTool?.type || 'transfer'}
                />
            )}
        </div>
    );

    function handleEdit(tool: any) {
        setSelectedToolType(tool.type);
        setEditingTool(tool);
        setShowModal(true);
    }

    function handleDelete(id: string) {
        if (confirm('Are you sure you want to delete this tool?')) {
            onUpdate(tools.filter(t => t.id !== id));
        }
    }

    function handleSave(tool: any) {
        if (editingTool) {
            onUpdate(tools.map(t => t.id === editingTool.id ? tool : t));
        } else {
            onUpdate([...tools, { ...tool, id: crypto.randomUUID() }]);
        }
        setShowModal(false);
    }
}

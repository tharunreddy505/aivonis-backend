'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreVertical, Edit2, Trash2, Loader2, Edit } from 'lucide-react';
import type { Agent } from '@/lib/agents';

interface AgentCardProps {
    agent: Agent;
    isActive?: boolean;
    onActivate?: (id: string) => void;
    isAdmin?: boolean;
    currentUserId?: string;
}

const AgentCard = ({ agent, isActive = false, onActivate, isAdmin = false, currentUserId }: AgentCardProps) => {
    const [activating, setActivating] = useState(false);

    // User can edit/delete if they are admin OR if they own the agent
    const canModify = isAdmin || (currentUserId && agent.userId === currentUserId);

    const handleActivate = async () => {
        if (onActivate) {
            setActivating(true);
            await onActivate(agent.id);
            setActivating(false);
        }
    }

    const handleDelete = async () => {
        if (confirm(`Are you sure you want to delete ${agent.name}?`)) {
            try {
                const response = await fetch(`/api/agents/${agent.id}`, { method: 'DELETE' });
                if (response.ok) {
                    window.location.reload(); // Refresh to show updated list
                } else {
                    alert('Failed to delete agent');
                }
            } catch (error) {
                console.error('Error deleting agent:', error);
            }
        }
    };

    return (
        <div className={`
            backdrop-blur-xl border rounded-2xl p-6 transition-all group relative overflow-hidden
            ${isActive
                ? 'bg-blue-50 border-blue-200 hover:border-blue-300 shadow-md'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'}
        `}>
            {/* Decorative gradient blur */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl transition-all ${isActive ? 'bg-blue-500/10' : 'bg-blue-100/40 group-hover:bg-blue-200/40'}`}></div>

            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center relative">
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${isActive ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-slate-400'}`}></div>
                        <span className="text-xl">{agent.gender === 'male' ? '👨' : '👩'}</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg leading-tight">{agent.name}</h3>
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{agent.voice} Voice</span>
                    </div>
                </div>
                <div className="flex gap-1">
                    {canModify && (
                        <>
                            <Link href={`/agents/${agent.id}/edit`} className="p-2 text-slate-400 hover:text-slate-900 transition-colors" title="Edit Agent">
                                <Edit2 size={18} />
                            </Link>
                            <button
                                onClick={handleDelete}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                title="Delete Agent"
                            >
                                <Trash2 size={18} />
                            </button>
                        </>
                    )}
                    <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </div>

            <p className="text-sm text-slate-500 line-clamp-2 mb-6 h-10 italic">
                "{agent.prompt}"
            </p>

            <div className="flex items-center justify-between mt-auto">
                <div className="flex gap-2">
                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">AGENT #{agent.id.substring(0, 5)}</span>
                </div>
                <div className="flex gap-3">
                    {!isActive && onActivate && (
                        <button
                            onClick={handleActivate}
                            disabled={activating}
                            className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:text-white hover:bg-slate-900 transition-all"
                        >
                            {activating ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                "Set Active"
                            )}
                        </button>
                    )}

                    {isActive && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-bold border border-green-200">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Active
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgentCard;

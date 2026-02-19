'use client';

import { useState } from 'react';
import AgentCard from '@/components/AgentCard';
import Link from 'next/link';
import type { Agent } from '@/lib/agents';

interface AgentsGridProps {
    agents: Agent[];
    initialActiveAgentId: string;
    isAdmin: boolean;
}

export default function AgentsGrid({ agents, initialActiveAgentId, isAdmin }: AgentsGridProps) {
    const [activeAgentId, setActiveAgentId] = useState(initialActiveAgentId);

    const handleActivate = async (id: string) => {
        try {
            const res = await fetch('/api/agents/active', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (res.ok) {
                setActiveAgentId(id);
            }
        } catch (err) {
            console.error('Failed to activate agent', err);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
                <AgentCard
                    key={agent.id}
                    agent={agent}
                    isActive={agent.id === activeAgentId}
                    onActivate={isAdmin ? handleActivate : undefined}
                    isAdmin={isAdmin}
                />
            ))}
            {isAdmin && (
                <Link href="/agents/new" className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 group hover:border-slate-300 transition-colors cursor-pointer min-h-[220px]">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="text-2xl text-blue-500">+</span>
                    </div>
                    <p className="font-bold text-slate-600 group-hover:text-slate-900">Create New Agent</p>
                    <p className="text-xs text-slate-600 mt-1">Configure voice and behavior</p>
                </Link>
            )}
        </div>
    );
}

"use client";

import { Plus, Search, Filter, Loader2 } from 'lucide-react';
import Link from 'next/link';
import AgentCard from '@/components/AgentCard';
import type { Agent } from '@/lib/agents'; // Import Agent type only
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function AgentsPage() {
    const { data: session, status } = useSession();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('All Voices');
    const [activeAgentId, setActiveAgentId] = useState<string>('1');

    const isAdmin = session?.user?.role === 'admin';

    useEffect(() => {
        if (status === 'unauthenticated') {
            redirect('/login');
        }
    }, [status]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [agentsRes, activeRes] = await Promise.all([
                    fetch('/api/agents'),
                    fetch('/api/agents/active')
                ]);

                const agentsData = await agentsRes.json();
                const activeData = await activeRes.json();

                // API now handles filtering based on session
                const filteredAgents = Array.isArray(agentsData) ? agentsData : [];

                setAgents(filteredAgents);
                if (activeData && activeData.activeAgentId) {
                    setActiveAgentId(activeData.activeAgentId);
                }
            } catch (err) {
                console.error('Failed to fetch data', err);
            } finally {
                setLoading(false);
            }
        };

        if (status === 'authenticated') {
            fetchData();
        }
    }, [status, isAdmin, session?.user?.assignedAgentId]);


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

    const filteredAgents = agents.filter(agent => {
        const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            agent.prompt.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesFilter = true;
        if (filter === 'Male Only') matchesFilter = agent.gender === 'male';
        if (filter === 'Female Only') matchesFilter = agent.gender === 'female';

        return matchesSearch && matchesFilter;
    });

    if (loading || status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Agents</h1>
                    <p className="text-slate-500">Manage and configure your automated telephone assistants.</p>
                </div>
                <Link href="/agents/new" className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-xl text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all">
                    <Plus size={18} />
                    Create New Agent
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search agents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-12 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all">
                        <Filter size={16} />
                        Filter
                    </button>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="flex-1 md:flex-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                    >
                        <option>All Voices</option>
                        <option>Male Only</option>
                        <option>Female Only</option>
                    </select>
                </div>
            </div>

            {/* Agents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAgents.length === 0 ? (
                    <div className="col-span-full text-center text-slate-500 py-12">
                        No agents found matching your search.
                    </div>
                ) : (
                    filteredAgents.map((agent) => (
                        <AgentCard
                            key={agent.id}
                            agent={agent}
                            isActive={agent.id === activeAgentId}
                            onActivate={handleActivate}
                            isAdmin={isAdmin}
                            currentUserId={session?.user?.id}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

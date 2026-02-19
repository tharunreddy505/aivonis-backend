'use client';

import { useState, useEffect } from 'react';
import { Phone, Search, MoreHorizontal, User, RefreshCw, Plus, Loader2 } from 'lucide-react';
import AssignNumberModal from '@/components/AssignNumberModal';

interface PhoneNumber {
    id: string;
    phoneNumber: string;
    friendlyName: string;
    agentId: string | null;
    agent: {
        id: string;
        name: string;
    } | null;
}

interface Agent {
    id: string;
    name: string;
    phoneNumber: string | null; // For the modal prop compatibility
    prompt: string;
    voice: any;
    gender: any;
    createdAt: Date;
}

export default function PhoneNumbersPage() {
    const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [numbersRes, agentsRes] = await Promise.all([
                fetch('/api/numbers'),
                fetch('/api/agents')
            ]);

            if (numbersRes.ok) {
                try {
                    const data = await numbersRes.json();
                    setNumbers(data);
                } catch (e) {
                    console.error('Failed to parse numbers response:', e);
                }
            } else {
                console.error('Failed to fetch numbers:', numbersRes.status, numbersRes.statusText);
            }

            if (agentsRes.ok) {
                try {
                    const data = await agentsRes.json();
                    setAgents(data);
                } catch (e) {
                    console.error('Failed to parse agents response:', e);
                }
            } else {
                console.error('Failed to fetch agents:', agentsRes.status, agentsRes.statusText);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAssign = async (numberId: string, agentId: string) => {
        try {
            const res = await fetch(`/api/numbers/${numberId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId }),
            });

            if (res.ok) {
                fetchData(); // Refresh list
            } else {
                alert('Failed to update assignment');
            }
        } catch (error) {
            console.error('Error assigning agent:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will remove the number from the database (does not release from Twilio in this demo).')) return;

        try {
            const res = await fetch(`/api/numbers/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setNumbers(prev => prev.filter(n => n.id !== id));
            }
        } catch (error) {
            console.error('Error deleting number:', error);
        }
    };

    const filteredNumbers = numbers.filter(n =>
        n.phoneNumber.includes(searchTerm) ||
        n.friendlyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.agent?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Dummy agent for the modal because it expects an agent prop to pre-fill ID
    // We will just use the first agent or a dummy one, but the Modal actually initiates the buy.
    // Wait, the existing modal takes an 'Agent' and assigns the bought number to THAT agent specifically.
    // If we want a generic "Buy Number" flow relative to the screenshot, maybe we pick a default agent or
    // we modify the modal to allow selecting an agent.
    // For V1 matching the user flow: "Add Number -> Buy Number". 
    // Let's create a temporary dummy agent object for the modal or pick the first unassigned agent.
    const modalAgent = agents[0] || { id: 'temp', name: 'New Agent', prompt: '', voice: 'alloy', gender: 'male', createdAt: new Date() };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900">Phone Numbers</h1>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-slate-200">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>
                    <button
                        onClick={() => setShowBuyModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-transparent hover:bg-slate-800 text-white rounded-xl transition-all font-medium text-sm shadow-lg shadow-slate-900/10"
                    >
                        <Plus size={16} />
                        Add Number
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    <th className="p-4">Number</th>
                                    <th className="p-4">Assistant</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-sm">
                                {filteredNumbers.length > 0 ? filteredNumbers.map((num) => (
                                    <tr key={num.id} className="group hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-medium text-slate-900 flex items-center gap-3">
                                            {num.phoneNumber}
                                            {/* Simulate "SIP Trunk" tag if relevant, or just show type */}
                                            {/* <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">Twilio</span> */}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={num.agentId || ''}
                                                    onChange={(e) => handleAssign(num.id, e.target.value)}
                                                    className="bg-transparent border-none text-slate-600 focus:ring-0 cursor-pointer hover:text-slate-900"
                                                >
                                                    <option value="" className="bg-white text-slate-500">Unassigned</option>
                                                    {agents.map(a => (
                                                        <option key={a.id} value={a.id} className="bg-white text-slate-900">
                                                            {a.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {num.agentId ? (
                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                ) : (
                                                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDelete(num.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Delete Number"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-slate-500 italic">
                                            No numbers found. Add one to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal - We reuse the existing one. 
                Ideally, we'd refactor it to allow selecting an agent *after* or *during* purchase.
                For now, if we pass a dummy agent, it will "assign" to that dummy ID when buying.
                We might need to fix that logic if we want to leave it unassigned initially.
                The current AssignNumberModal takes 'agent.id' and sends it to the API.
                API /api/twilio/buy requires agentId. 
                
                Workaround: We can pass the first agent's ID if available, or force the user to pick one?
                Actually, let's keep it simple: If you add a number here, it assigns to the first available agent or requires you to have at least one agent.
            */}
            {agents.length > 0 && (
                <AssignNumberModal
                    agent={modalAgent}
                    isOpen={showBuyModal}
                    onClose={() => {
                        setShowBuyModal(false);
                        fetchData(); // Refresh list after potential buy
                    }}
                    onAssign={() => { }} // We handle refresh in onClose
                />
            )}
        </div>
    );
}

import { Phone, Users, Calendar, ArrowUpRight, Activity, LogOut } from 'lucide-react';
import Link from 'next/link';
import { getAgents } from '@/lib/agents';
import { auth, signOut } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AgentsGrid from '@/components/AgentsGrid';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Force refresh on every request

export default async function Dashboard() {
  const session = await auth();
  if (!session || !session.user) redirect('/login');

  const isAdmin = session.user.role === 'admin';
  const userId = session.user.id;
  const assignedAgentId = session.user.assignedAgentId;

  // 1. Fetch Agents (Filtered)
  const agents = await getAgents(
    isAdmin ? undefined : userId,
    isAdmin ? undefined : assignedAgentId
  );

  const activeAgentId = assignedAgentId || (agents.length > 0 ? agents[0].id : '1');

  // 2. Build Filter for Calls/Stats
  // Filter calls where the agent is owned by the user OR assigned to the user
  const agentFilter: any = {};
  if (!isAdmin) {
    const conditions = [];
    if (userId) conditions.push({ userId });
    if (assignedAgentId) conditions.push({ id: assignedAgentId });

    // If no valid conditions (e.g. new user with no agents), ensure query finds nothing
    if (conditions.length === 0) {
      agentFilter.id = 'NO_MATCH';
    } else {
      agentFilter.OR = conditions;
    }
  }

  const whereCall = isAdmin ? {} : {
    agent: agentFilter
  };

  // 3. Fetch Stats from DB
  let totalCalls = 0;
  let totalMinutes = 0;
  let appointmentCount = 0;

  try {
    const aggregations = await prisma.call.aggregate({
      _count: { id: true },
      _sum: { duration: true },
      where: whereCall
    });

    totalCalls = aggregations._count.id;
    totalMinutes = Math.round((aggregations._sum.duration || 0) / 60);

    // Calculate appointments
    // Efficient way: Count transcripts containing keywords for relevant calls
    const appointmentTranscripts = await prisma.transcript.findMany({
      distinct: ['callSid'],
      where: {
        call: whereCall, // Filter by same call criteria
        content: {
          contains: 'appointment'
        }
      }
    });

    // Note: distinct by callSid gives us number of calls with appointment mentions
    // Simplification for 'Appointment Count'
    appointmentCount = appointmentTranscripts.length;

  } catch (err) {
    console.error('Error fetching DB stats:', err);
  }

  // 4. Fetch Recent Calls
  let recentCallsData: any[] = [];
  try {
    const recentCalls = await prisma.call.findMany({
      where: whereCall,
      orderBy: { startTime: 'desc' },
      take: 5,
      include: { agent: true }
    });

    recentCallsData = recentCalls.map(call => {
      // Calculate relative time
      const startTime = new Date(call.startTime);
      const diffMs = Date.now() - startTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      let timeAgo = `${diffMins} mins ago`;
      if (diffMins >= 60) timeAgo = `${Math.floor(diffMins / 60)} hours ago`;
      if (diffMins >= 1440) timeAgo = `${Math.floor(diffMins / 1440)} days ago`;

      return {
        caller: call.callSid.substring(0, 8) + '...', // Or use a 'from' field if added to schema
        agentName: call.agent?.name?.split(' ')[0] || 'Unknown',
        duration: call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : '0s',
        status: call.status.charAt(0).toUpperCase() + call.status.slice(1),
        time: timeAgo
      };
    });
  } catch (err) {
    console.error('Error fetching recent calls:', err);
  }

  const activeAgentsCount = agents.length;

  const stats = [
    { label: 'Total Calls', value: totalCalls.toString(), change: '+12.5%', icon: Phone, color: 'text-blue-500' },
    { label: 'Active Agents', value: activeAgentsCount.toString(), change: 'Stable', icon: Users, color: 'text-purple-500' },
    { label: 'Minutes Used', value: totalMinutes.toString() + 'm', change: '+8.2%', icon: Activity, color: 'text-green-500' },
    { label: 'Appointments', value: appointmentCount.toString(), change: '+22.4%', icon: Calendar, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back, {session.user?.name || 'User'}</h1>
          <p className="text-slate-500">Here's what's happening with your AI agents today.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/api/auth/signout" className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2">
            <LogOut size={16} />
            Sign Out
          </Link>
          {/* Allow creating agents if Admin or simply authenticated (Owner model) */}
          <Link href="/agents/new" className="px-5 py-2.5 bg-blue-600 rounded-xl text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all">
            + New Agent
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:border-slate-300 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-white border border-slate-200 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-green-500/10 text-green-600' : 'bg-slate-200 text-slate-600'}`}>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
              <h2 className="text-2xl font-bold text-slate-900">{stat.value}</h2>
            </div>
            <ArrowUpRight size={16} className="absolute top-6 right-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </div>
        ))}
      </div>

      {/* Agents Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Your AI Agents</h2>
          <Link href="/agents" className="text-sm text-blue-400 font-semibold hover:text-blue-300 transition-colors">View All Agents</Link>
        </div>
        <AgentsGrid agents={agents} initialActiveAgentId={activeAgentId} isAdmin={isAdmin} />
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-6">Recent AI Calls</h2>
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Caller</th>
                <th className="px-6 py-4">Agent</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {recentCallsData.length > 0 ? recentCallsData.map((call, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4 font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{call.caller}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 font-medium text-xs border border-slate-200">{call.agentName}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{call.duration}</td>
                  <td className="px-6 py-4 text-slate-500">
                    <span className={`flex items-center gap-1.5 ${call.status === 'Completed' || call.status === 'completed' ? 'text-green-600' : 'text-slate-500'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${call.status === 'Completed' || call.status === 'completed' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                      {call.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-right">{call.time}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">No recent calls found</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
            <Link href="/calls" className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">View All Call History</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

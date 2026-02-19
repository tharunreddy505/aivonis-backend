import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
    return (
        <div className="space-y-10 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-end">
                <div>
                    <div className="h-8 w-64 bg-slate-800 rounded-lg mb-2"></div>
                    <div className="h-4 w-48 bg-slate-800 rounded-lg"></div>
                </div>
                <div className="flex gap-4">
                    <div className="h-10 w-24 bg-slate-800 rounded-xl"></div>
                    <div className="h-10 w-32 bg-slate-800 rounded-xl"></div>
                </div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-32">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-slate-800 rounded-xl"></div>
                            <div className="w-12 h-6 bg-slate-800 rounded-full"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 w-20 bg-slate-800 rounded"></div>
                            <div className="h-8 w-16 bg-slate-800 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Agents Section Skeleton */}
            <section>
                <div className="flex justify-between items-center mb-6">
                    <div className="h-6 w-32 bg-slate-800 rounded"></div>
                    <div className="h-4 w-24 bg-slate-800 rounded"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-48"></div>
                    ))}
                </div>
            </section>

            {/* Recent Activity Skeleton */}
            <section>
                <div className="h-6 w-48 bg-slate-800 rounded mb-6"></div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-64"></div>
            </section>

            <div className="fixed bottom-8 right-8 flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full border border-slate-800 shadow-lg">
                <Loader2 className="animate-spin text-blue-500" size={16} />
                <span className="text-xs text-slate-400">Loading data...</span>
            </div>
        </div>
    );
}

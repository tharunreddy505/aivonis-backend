"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Home, Users, Phone, Settings, LayoutDashboard, Mic, FileText } from 'lucide-react';
import { useSession } from 'next-auth/react';
import UserAccountDropdown from './UserAccountDropdown';

const Sidebar = () => {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'admin';

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
        { icon: Users, label: 'Agents', href: '/agents' },
        { icon: FileText, label: 'Knowledge Base', href: '/knowledge-base' },
        { icon: Phone, label: 'Call History', href: '/calls' },
        { icon: Mic, label: 'Recordings', href: '/recordings' },
        { icon: Phone, label: 'Phone Numbers', href: '/phone-numbers' },
        ...(isAdmin ? [{ icon: Settings, label: 'Settings', href: '/settings' }] : []),
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 text-slate-600 p-6 z-50 flex flex-col">
            <div className="flex items-center gap-3 mb-10 px-2">
                <Image
                    src="/logo.png"
                    alt="AIVonis"
                    width={150}
                    height={40}
                    className="h-10 w-auto object-contain"
                    priority
                    unoptimized
                />
            </div>

            <nav className="space-y-2 flex-1">
                {menuItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        prefetch={false} // Disable prefetching to reduce dev server load
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-slate-100 hover:text-slate-900 group"
                    >
                        <item.icon size={20} className="text-slate-500 group-hover:text-blue-500 transition-colors" />
                        <span className="font-medium text-sm">{item.label}</span>
                    </Link>
                ))}
            </nav>

            {/* User Account Dropdown at Bottom */}
            <div className="mt-auto pt-4 border-t border-slate-200">
                <UserAccountDropdown />
            </div>
        </aside>
    );
};

export default Sidebar;

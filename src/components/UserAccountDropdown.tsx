"use client";

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { User, FileText, Shield, LogOut } from 'lucide-react';

const UserAccountDropdown = () => {
    const { data: session, status } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get user initials for avatar
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Show loading skeleton while session is loading
    if (status === 'loading') {
        return (
            <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-10 h-10 rounded-full bg-slate-800 animate-pulse"></div>
                <div className="hidden lg:block space-y-2">
                    <div className="h-3 w-24 bg-slate-800 rounded animate-pulse"></div>
                    <div className="h-2 w-32 bg-slate-800 rounded animate-pulse"></div>
                </div>
            </div>
        );
    }

    // Don't show if not authenticated
    if (!session?.user) return null;

    const userName = session.user.name || 'User';
    const userEmail = session.user.email || '';
    const initials = getInitials(userName);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* User Avatar Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all group"
            >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                    {initials}
                </div>
                <div className="hidden lg:block text-left">
                    <div className="text-sm font-medium text-slate-900">{userName}</div>
                    <div className="text-xs text-slate-400">{userEmail}</div>
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute left-0 right-0 bottom-full mb-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-[100]">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg">
                                {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-slate-900 truncate">{userName}</div>
                                <div className="text-xs text-slate-400 truncate">{userEmail}</div>
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                        <Link
                            href="/account"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
                        >
                            <User size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                            <span className="text-sm text-slate-600 group-hover:text-slate-900">Account</span>
                        </Link>

                        <Link
                            href="/terms"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
                        >
                            <FileText size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                            <span className="text-sm text-slate-600 group-hover:text-slate-900">Terms and Conditions</span>
                        </Link>

                        <Link
                            href="/privacy"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
                        >
                            <Shield size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                            <span className="text-sm text-slate-600 group-hover:text-slate-900">Privacy Policy</span>
                        </Link>

                        <div className="border-t border-slate-200 my-2"></div>

                        <button
                            onClick={() => {
                                setIsOpen(false);
                                signOut({ callbackUrl: '/login' });
                            }}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-red-900/20 transition-colors group w-full text-left"
                        >
                            <LogOut size={18} className="text-slate-400 group-hover:text-red-500 transition-colors flex-shrink-0" />
                            <span className="text-sm text-slate-600 group-hover:text-red-400">Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserAccountDropdown;

"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Lock, User, Mail, Shield } from 'lucide-react';

export default function AccountPage() {
    const { data: session, update } = useSession();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            setMessage({ type: 'error', text: 'All fields are required' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Password changed successfully' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to change password' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    if (!session?.user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-slate-400">Loading...</div>
            </div>
        );
    }

    const userName = session.user.name || 'User';
    const userEmail = session.user.email || '';
    const userRole = session.user.role || 'staff';

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Account Settings</h1>
                <p className="text-slate-500">Manage your account information and security</p>
            </div>

            {/* User Information Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
                    <User size={24} className="text-blue-500" />
                    Profile Information
                </h2>

                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-blue-600 font-bold text-2xl shadow-lg ring-4 ring-white">
                            {userName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                            <div className="text-lg font-semibold text-slate-900">{userName}</div>
                            <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                <Mail size={14} />
                                {userEmail}
                            </div>
                            <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                <Shield size={14} />
                                <span className="capitalize">{userRole}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
                    <Lock size={24} className="text-blue-500" />
                    Change Password
                </h2>

                <form onSubmit={handleChangePassword} className="space-y-6">
                    {/* Current Password */}
                    <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 mb-2">
                            Current Password
                        </label>
                        <input
                            type="password"
                            id="currentPassword"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter current password"
                            disabled={loading}
                        />
                    </div>

                    {/* New Password */}
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-2">
                            New Password
                        </label>
                        <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter new password"
                            disabled={loading}
                        />
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Confirm new password"
                            disabled={loading}
                        />
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`p-4 rounded-xl ${message.type === 'success'
                            ? 'bg-green-900/20 border border-green-800 text-green-400'
                            : 'bg-red-900/20 border border-red-800 text-red-400'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-xl"
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </form>
            </div>
        </div>
    );
}

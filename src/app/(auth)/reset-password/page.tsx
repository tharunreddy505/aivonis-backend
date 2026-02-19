'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Star, ArrowLeft, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';

// Separate component for search params access
function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (!token) {
            setError('Invalid or missing reset token');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    password
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to reset password');
                return;
            }

            setSuccess(true);
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
                    <AlertTriangle className="text-red-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">
                    Invalid Link
                </h2>
                <p className="text-slate-600 mb-8">
                    This password reset link is invalid or has expired. Please request a new one.
                </p>
                <Link
                    href="/forgot-password"
                    className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                    Request New Link
                </Link>
            </div>
        );
    }

    if (success) {
        return (
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                    <CheckCircle2 className="text-green-600" size={32} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3">
                    Password Reset!
                </h2>
                <p className="text-slate-600 mb-8">
                    Your password has been successfully updated. You can now log in with your new password.
                </p>
                <Link
                    href="/login"
                    className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                    Back to Login
                </Link>
            </div>
        );
    }

    return (
        <>
            {/* Header Text */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    Set New Password
                </h2>
                <p className="text-slate-500">
                    Please enter your new password below.
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                    <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                    {error}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">New Password</label>
                    <div className="relative">
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 pl-11 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-400 bg-slate-50"
                            required
                            minLength={6}
                        />
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Confirm Password</label>
                    <div className="relative">
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 pl-11 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-400 bg-slate-50"
                            required
                            minLength={6}
                        />
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" size={20} />}
                        Reset Password
                    </button>
                </div>

                <div className="text-center pt-4">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium"
                    >
                        <ArrowLeft size={16} />
                        Back to Login
                    </Link>
                </div>
            </form>
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-screen bg-white font-sans text-slate-900">
            {/* Left Side - Form */}
            <div className="w-full lg:w-[50%] p-8 lg:p-16 flex flex-col justify-center relative z-10">
                <div className="absolute top-8 left-8 lg:left-16">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
                        AIvonis
                    </h1>
                </div>

                <div className="max-w-md w-full mx-auto">
                    <Suspense fallback={
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin text-blue-600" size={32} />
                        </div>
                    }>
                        <ResetPasswordForm />
                    </Suspense>
                </div>
            </div>

            {/* Right Side - Content */}
            <div className="hidden lg:flex w-[50%] bg-[#5D5CDE] text-white p-16 flex-col justify-center items-center relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>

                <div className="max-w-lg relative z-10 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">More Time for Essentials</h2>
                    <p className="text-lg text-indigo-100 mb-12">
                        Our AI handles calls, relieves employees, and guarantees 100% availability.
                    </p>

                    {/* Reviews Mockup */}
                    <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/10">
                        <div className="flex -space-x-3 mr-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#5D5CDE] bg-slate-200 overflow-hidden relative">
                                    {/* Avatar Circles */}
                                </div>
                            ))}
                        </div>
                        <div className="text-left">
                            <div className="flex gap-1 text-yellow-400 text-xs mb-0.5">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Star key={i} size={12} fill="currentColor" />
                                ))}
                            </div>
                            <p className="text-xs font-medium">
                                4.5 and 4.9 on <strong>Trustpilot</strong> and <strong>Google</strong>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

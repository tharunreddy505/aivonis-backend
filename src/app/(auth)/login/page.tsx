'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Star, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Register specific
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [company, setCompany] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                email: email.trim(),
                password,
                redirect: false,
            });

            console.log("Login Result:", result);
            if (result?.error) {
                // Determine user-friendly error or show raw error for debugging
                const errorMessage = result.error === 'CredentialsSignin'
                    ? 'Invalid email or password'
                    : `Login Error: ${result.error}`;
                setError(errorMessage);
            } else {
                router.push('/');
                router.refresh();
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email: email.trim(),
                    password,
                    company
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Registration failed');
                return;
            }

            // Auto login after register
            await signIn('credentials', {
                email: email.trim(),
                password,
                redirect: false,
            });

            router.push('/');
            router.refresh();

        } catch (err) {
            setError('An error occurred during registration.');
        } finally {
            setLoading(false);
        }
    };

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
                    {/* Header Text */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">
                            {isRegister ? 'Create Account' : 'Welcome Back'}
                        </h2>
                        {!isRegister && (
                            <p className="text-slate-500">Log in to continue</p>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                            <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                            {error}
                        </div>
                    )}

                    {/* Forms */}
                    {isRegister ? (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">First Name</label>
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-400 bg-slate-50"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700">Last Name</label>
                                    <input
                                        type="text"
                                        placeholder="Last Name"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-400 bg-slate-50"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Company</label>
                                <input
                                    type="text"
                                    placeholder="Company Name"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-400 bg-slate-50"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Email</label>
                                <input
                                    type="email"
                                    placeholder="example@aivonis.ai"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-400 bg-slate-50"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Password</label>
                                <input
                                    type="password"
                                    placeholder={!password ? "" : "••••••••"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-400 bg-slate-50"
                                    required
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading && <Loader2 className="animate-spin" size={20} />}
                                    Next
                                </button>
                            </div>

                            <div className="text-xs text-slate-500 mt-4 leading-relaxed">
                                By creating an account, you agree to our <a href="#" className="underline hover:text-blue-600">Terms and Conditions</a> and confirm that you have read our <a href="#" className="underline hover:text-blue-600">Privacy Policy</a>.
                            </div>

                            <div className="text-center pt-4">
                                <p className="text-sm text-slate-600">
                                    Do you already have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setError('');
                                            setIsRegister(false);
                                        }}
                                        className="text-blue-600 font-semibold hover:underline"
                                    >
                                        Login
                                    </button>
                                </p>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Email</label>
                                <input
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-400 bg-slate-50"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder:text-slate-400 bg-slate-50"
                                    required
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading && <Loader2 className="animate-spin" size={20} />}
                                    Login
                                </button>
                            </div>

                            <div className="flex flex-col items-center gap-4 mt-4">
                                <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                                    Forgot Password?
                                </Link>
                                <p className="text-sm text-slate-600">
                                    Don't have an account yet?{' '}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setError('');
                                            setIsRegister(true);
                                        }}
                                        className="text-blue-600 font-semibold hover:underline"
                                    >
                                        Register
                                    </button>
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Right Side - Content */}
            <div className="hidden lg:flex w-[50%] bg-[#5D5CDE] text-white p-16 flex-col justify-center items-center relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>

                <div className="max-w-lg relative z-10">
                    {isRegister ? (
                        <>
                            <div className="mb-12">
                                <p className="text-xl md:text-2xl font-light leading-relaxed opacity-90">
                                    "Due to high demand, our service lines were frequently busy, leading to frustrated or even lost customers.
                                    <br /><br />
                                    AIvonis handles <span className="font-bold">2000+ calls</span> for us monthly – no more lost customers, no more missed revenue."
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-indigo-300 border-2 border-white/20 overflow-hidden relative">
                                    {/* Placeholder Avatar */}
                                    <div className="absolute inset-0 bg-slate-300"></div>
                                </div>
                                <div>
                                    <p className="font-bold">AIvonis</p>
                                    <p className="text-sm text-indigo-100">Managing Director</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center">
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
                    )}
                </div>
            </div>
        </div>
    );
}

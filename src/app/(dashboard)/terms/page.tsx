"use client";

import { FileText } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <FileText size={32} className="text-blue-500" />
                        Terms and Conditions
                    </h1>
                    <p className="text-slate-400">Last updated: February 12, 2026</p>
                </div>

                {/* Content */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
                        <p className="text-slate-300 leading-relaxed">
                            By accessing and using AIVonis, you accept and agree to be bound by the terms and provision of this agreement.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">2. Use License</h2>
                        <p className="text-slate-300 leading-relaxed">
                            Permission is granted to temporarily use AIVonis for personal or commercial purposes. This is the grant of a license, not a transfer of title.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">3. Service Description</h2>
                        <p className="text-slate-300 leading-relaxed">
                            AIVonis provides AI-powered voice assistant services for handling phone calls. We reserve the right to modify or discontinue the service at any time.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">4. User Responsibilities</h2>
                        <p className="text-slate-300 leading-relaxed">
                            You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">5. Limitations</h2>
                        <p className="text-slate-300 leading-relaxed">
                            In no event shall AIVonis or its suppliers be liable for any damages arising out of the use or inability to use the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">6. Contact Information</h2>
                        <p className="text-slate-300 leading-relaxed">
                            If you have any questions about these Terms and Conditions, please contact us at support@aivonis.ai
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}

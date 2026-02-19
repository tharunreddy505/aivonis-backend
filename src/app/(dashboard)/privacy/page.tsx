"use client";

import { Shield } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-slate-950 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Shield size={32} className="text-blue-500" />
                        Privacy Policy
                    </h1>
                    <p className="text-slate-400">Last updated: February 12, 2026</p>
                </div>

                {/* Content */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
                        <p className="text-slate-300 leading-relaxed mb-3">
                            We collect information that you provide directly to us, including:
                        </p>
                        <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                            <li>Account information (name, email, password)</li>
                            <li>Call recordings and transcripts</li>
                            <li>Usage data and analytics</li>
                            <li>Payment information</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
                        <p className="text-slate-300 leading-relaxed mb-3">
                            We use the information we collect to:
                        </p>
                        <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                            <li>Provide, maintain, and improve our services</li>
                            <li>Process transactions and send related information</li>
                            <li>Send technical notices and support messages</li>
                            <li>Respond to your comments and questions</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">3. Data Security</h2>
                        <p className="text-slate-300 leading-relaxed">
                            We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">4. Data Retention</h2>
                        <p className="text-slate-300 leading-relaxed">
                            We retain your information for as long as your account is active or as needed to provide you services. You may request deletion of your data at any time.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">5. Third-Party Services</h2>
                        <p className="text-slate-300 leading-relaxed">
                            We use third-party services including Twilio, OpenAI, and AWS. These services have their own privacy policies governing the use of your information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">6. Your Rights</h2>
                        <p className="text-slate-300 leading-relaxed">
                            You have the right to access, update, or delete your personal information at any time. Contact us at privacy@aivonis.ai for assistance.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-white mb-3">7. Contact Us</h2>
                        <p className="text-slate-300 leading-relaxed">
                            If you have any questions about this Privacy Policy, please contact us at privacy@aivonis.ai
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}

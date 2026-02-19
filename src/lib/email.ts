import nodemailer from 'nodemailer';
import { getSettings } from '@/lib/config';

interface EmailTranscriptProps {
    recipientEmail: string;
    agentName: string;
    callSid: string;
    transcript: string;
    startTime: Date;
    duration?: string;
    callerNumber?: string;
}

export async function sendTranscriptEmail({
    recipientEmail,
    agentName,
    callSid,
    transcript,
    startTime,
    callerNumber
}: EmailTranscriptProps): Promise<{ success: boolean; error?: string }> {
    try {
        const settings = await getSettings();

        // 1. Basic Validation
        if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
            console.error('[Email] SMTP settings not configured.');
            return { success: false, error: 'SMTP settings not configured' };
        }

        // 2. Create Transporter
        const isSecure = settings.smtpSecure ?? (settings.smtpPort === 465);

        const transporter = nodemailer.createTransport({
            host: settings.smtpHost,
            port: settings.smtpPort || 587,
            secure: isSecure,
            auth: {
                user: settings.smtpUser,
                pass: settings.smtpPassword,
            },
        });

        // 3. Email Content construction
        // Format transcript lines for better readability
        const formattedTranscript = transcript.split('\n').map(line => {
            const [role, ...contentParts] = line.split(':');
            const content = contentParts.join(':').trim();
            const isUser = role.trim().toLowerCase() === 'user';

            // Replicate the style: "Role: Content" but cleaner
            return `<div style="margin-bottom: 8px;">
                <span style="font-weight: bold; color: ${isUser ? '#333' : '#666'};">${role.charAt(0).toUpperCase() + role.slice(1)}:</span> 
                <span style="color: #444;">${content}</span>
            </div>`;
        }).join('');

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const callLink = `${baseUrl}/calls?id=${callSid}`;

        const subject = `New Call from ${callerNumber || 'Unknown'} - ${agentName}`;

        const html = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.6;">
                <p style="font-size: 16px; margin-bottom: 24px;">Hello,</p>
                
                <p style="font-size: 16px; margin-bottom: 24px;">
                    You received a call from <strong>${callerNumber || 'Unknown'}</strong>!
                </p>

                <div style="margin-bottom: 24px;">
                    <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #000;">Link to the conversation:</h3>
                    <a href="${callLink}" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${callLink}</a>
                </div>

                <div style="margin-bottom: 24px;">
                    <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #000;">Summary:</h3>
                    <p style="margin: 0; color: #555;">
                        The call involved a conversation between the user and ${agentName}. 
                        (Full AI summary generation is coming soon)
                    </p>
                </div>

                <div>
                    <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 12px; color: #000;">Conversation Transcript:</h3>
                    <div style="font-size: 14px;">
                        ${formattedTranscript}
                    </div>
                </div>
                
                <div style="margin-top: 40px; border-top: 1px solid #eaeaea; padding-top: 20px; font-size: 12px; color: #888;">
                    Called on ${startTime.toLocaleString()} • ID: ${callSid}
                </div>
            </div>
        `;

        // 4. Send Email
        const info = await transporter.sendMail({
            from: `"Fonio AI" <${settings.smtpUser}>`,
            to: recipientEmail,
            subject: subject,
            html: html,
            text: `You received a call from ${callerNumber}.\n\nLink: ${callLink}\n\nTranscript:\n${transcript}`
        });

        console.log(`[Email] Transcript sent to ${recipientEmail}: ${info.messageId}`);
        return { success: true };

    } catch (error: any) {
        console.error('[Email] Failed to send transcript email:', error);
        return { success: false, error: error.message || 'Unknown SMTP error' };
    }
}

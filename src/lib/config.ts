import { prisma } from './db';

export async function getSettings() {
    try {
        const settings = await prisma.settings.findFirst({
            where: { id: 1 }
        });

        return {
            openaiApiKey: settings?.openaiApiKey || process.env.OPENAI_API_KEY,
            twilioAccountSid: settings?.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID,
            twilioAuthToken: settings?.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN,
            smtpHost: settings?.smtpHost || process.env.SMTP_HOST,
            smtpPort: settings?.smtpPort || (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined),
            smtpUser: settings?.smtpUser || process.env.SMTP_USER,
            smtpPassword: settings?.smtpPassword || process.env.SMTP_PASSWORD,
            smtpSecure: settings?.smtpSecure,
        };
    } catch (error) {
        console.error('Error fetching settings from DB:', error);
        return {
            openaiApiKey: process.env.OPENAI_API_KEY,
            twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
            twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
            smtpHost: process.env.SMTP_HOST,
            smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined,
            smtpUser: process.env.SMTP_USER,
            smtpPassword: process.env.SMTP_PASSWORD,
            smtpSecure: undefined,
        };
    }
}

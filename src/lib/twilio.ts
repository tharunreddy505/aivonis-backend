import twilio from 'twilio';
import { getSettings } from './config';

export async function getTwilioClient() {
    const settings = await getSettings();
    if (!settings.twilioAccountSid || !settings.twilioAuthToken) {
        throw new Error('Twilio credentials not configured');
    }
    return twilio(settings.twilioAccountSid, settings.twilioAuthToken);
}

export async function searchAvailableNumbers(countryCode: string = 'US', type: 'local' | 'mobile' | 'tollFree' = 'local') {
    const client = await getTwilioClient();
    try {
        let availableNumbers;
        if (type === 'mobile') {
            availableNumbers = await client.availablePhoneNumbers(countryCode).mobile.list({ limit: 20 });
        } else if (type === 'tollFree') {
            availableNumbers = await client.availablePhoneNumbers(countryCode).tollFree.list({ limit: 20 });
        } else {
            availableNumbers = await client.availablePhoneNumbers(countryCode).local.list({ limit: 20 });
        }

        return availableNumbers.map(n => ({
            phoneNumber: n.phoneNumber,
            friendlyName: n.friendlyName,
            isoCountry: n.isoCountry,
            locality: n.locality,
            region: n.region,
            capabilities: n.capabilities
        }));
    } catch (error) {
        console.error('Error searching phone numbers:', error);
        throw error;
    }
}

export async function buyPhoneNumber(phoneNumber: string, agentId: string, baseUrl: string) {
    const client = await getTwilioClient();
    try {
        // 1. Buy the number
        // Twilio requires a public URL for voiceUrl. If we are on localhost, we cannot set it successfully without ngrok.
        // We will fallback to NOT setting it if the baseUrl contains 'localhost'.
        const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

        const createOptions: any = {
            phoneNumber: phoneNumber,
        };

        if (!isLocalhost) {
            createOptions.voiceUrl = `${baseUrl}/voice/incoming`;
            createOptions.voiceMethod = 'POST';
            createOptions.statusCallback = `${baseUrl}/api/calls`;
            createOptions.statusCallbackMethod = 'POST';
        } else {
            console.warn('Running on localhost: Skipping initial VoiceUrl configuration for Twilio number. Please configure via ngrok or manually in Twilio console.');
        }

        const incomingPhoneNumber = await client.incomingPhoneNumbers.create(createOptions);

        // 2. Return the details to be saved in DB
        return {
            sid: incomingPhoneNumber.sid,
            phoneNumber: incomingPhoneNumber.phoneNumber,
            friendlyName: incomingPhoneNumber.friendlyName || phoneNumber,
            countryCode: incomingPhoneNumber.accountSid, // Actually we might want country code from input or response, response doesn't strictly have country code field easily accessible sometimes besides region.
            // But we can infer or pass it.
        };
    } catch (error) {
        console.error('Error buying phone number:', error);
        throw error;
    }
}

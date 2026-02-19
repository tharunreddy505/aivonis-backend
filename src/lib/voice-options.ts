
export interface VoiceOption {
    id: string;
    name: string;
    gender: 'male' | 'female';
    accent: 'US' | 'British' | 'Multilingual';
    provider: 'openai' | 'elevenlabs';
    previewUrl?: string; // For the play button
    tags: string[];
    nativeId: string; // The actual ID sent to the API (e.g. 'alloy' or 'eleven_labs_id')
}

export const VOICE_OPTIONS: VoiceOption[] = [
    // OpenAI Standard Voices
    {
        id: 'alloy',
        name: 'Alloy',
        gender: 'female',
        accent: 'US',
        provider: 'openai',
        tags: ['Balanced', 'Standard'],
        nativeId: 'alloy'
    },
    {
        id: 'echo',
        name: 'Echo',
        gender: 'male',
        accent: 'US',
        provider: 'openai',
        tags: ['Warm', 'Standard'],
        nativeId: 'echo'
    },
    {
        id: 'shimmer',
        name: 'Shimmer',
        gender: 'female',
        accent: 'US',
        provider: 'openai',
        tags: ['Professional', 'Standard'],
        nativeId: 'shimmer'
    },

    // Premium Voices (Mocked for UI from screenshot - mapped to OpenAI for now)
    {
        id: 'james',
        name: 'James',
        gender: 'male',
        accent: 'British',
        provider: 'elevenlabs',
        tags: ['Calm', 'Professional'],
        nativeId: 'onyx' // Fallback to Onyx
    },
    {
        id: 'matt',
        name: 'Matt',
        gender: 'male',
        accent: 'British',
        provider: 'elevenlabs',
        tags: ['Friendly'],
        nativeId: 'fable' // Fallback to Fable
    },
    {
        id: 'maria',
        name: 'Maria',
        gender: 'female',
        accent: 'British',
        provider: 'elevenlabs',
        tags: ['Professional'],
        nativeId: 'shimmer' // Fallback to Shimmer
    },
    {
        id: 'anna',
        name: 'Anna',
        gender: 'female',
        accent: 'Multilingual',
        provider: 'elevenlabs',
        tags: ['Neutral'],
        nativeId: 'nova' // Fallback to Nova
    },
    {
        id: 'james_aus',
        name: 'Noah',
        gender: 'male',
        accent: 'Multilingual',
        provider: 'elevenlabs',
        tags: ['Deep'],
        nativeId: 'onyx'
    }
];

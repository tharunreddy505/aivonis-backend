export const PRICING_PLANS = {
    STARTER: {
        id: 'STARTER',
        name: 'Starter (Pay-As-You-Go)',
        monthlyPrice: 0,
        includedMinutes: 0,
        overageRatePerMin: 0.25,
        description: 'Best for sporadic usage'
    },
    PRO: {
        id: 'PRO',
        name: 'Pro Business',
        monthlyPrice: 99,
        includedMinutes: 1000,
        overageRatePerMin: 0.14,
        description: 'For growing teams'
    },
    ENTERPRISE: {
        id: 'ENTERPRISE',
        name: 'Enterprise',
        monthlyPrice: 299,
        includedMinutes: 3000,
        overageRatePerMin: 0.11,
        description: 'Volume & Scale'
    }
} as const;

export type PlanType = keyof typeof PRICING_PLANS;

export const BASE_COSTS = {
    // Direct Twilio/Provider costs (for internal margin tracking)
    twilio_inbound_per_min: 0.0085,
    recording_per_min: 0.0025,
    ai_per_min: 0.012, // Avg cost of AI + TTS
    phone_number_monthly: 1.15
};

export function calculateCallCost(planId: string, durationSeconds: number): { billedCost: number, baseCost: number } {
    const plan = PRICING_PLANS[planId as PlanType] || PRICING_PLANS.STARTER;
    const minutes = Math.ceil(durationSeconds / 60);

    // Billed Price (what user pays)
    const billedCost = minutes * plan.overageRatePerMin;

    // Base Cost (what we pay)
    const baseCostPerMin = BASE_COSTS.twilio_inbound_per_min + BASE_COSTS.recording_per_min + BASE_COSTS.ai_per_min;
    const baseCost = minutes * baseCostPerMin;

    return { billedCost, baseCost };
}

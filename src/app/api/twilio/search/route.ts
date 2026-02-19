import { NextResponse } from 'next/server';
import { searchAvailableNumbers } from '@/lib/twilio';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'US';
    const type = searchParams.get('type') || 'local';

    try {
        const numbers = await searchAvailableNumbers(country, type as any);
        return NextResponse.json({ numbers });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

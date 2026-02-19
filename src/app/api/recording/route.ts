import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/config';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Proxy the recording content to avoid valid Twilio auth issues in the browser
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const sid = searchParams.get('sid');

    if (!sid) {
        return new NextResponse('Missing sid', { status: 400 });
    }

    // Authenticate User
    const session = await auth();
    if (!session || !session.user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const isAdmin = session.user.role === 'admin';
    const userId = session.user.id;
    const assignedAgentId = session.user.assignedAgentId;

    // Verify Ownership
    if (!isAdmin) {
        // Find the call associated with this recording
        // We search by recordingUrl containing the SID
        const call = await prisma.call.findFirst({
            where: {
                recordingUrl: {
                    contains: sid
                }
            },
            include: {
                agent: true
            }
        });

        if (!call) {
            // Recording not found in our DB, deny access to non-admins
            return new NextResponse('Recording not found or unauthorized', { status: 404 });
        }

        // Check if user owns the agent or is assigned to it
        const isOwner = call.agent.userId === userId;
        const isAssigned = call.agentId === assignedAgentId;

        if (!isOwner && !isAssigned) {
            return new NextResponse('Unauthorized', { status: 401 });
        }
    }

    const settings = await getSettings();
    const accountSid = settings.twilioAccountSid;
    const authToken = settings.twilioAuthToken;

    if (!accountSid || !authToken) {
        return new NextResponse('Server configuration error', { status: 500 });
    }

    // Construct the Twilio recording URL
    // https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Recordings/{RecordingSid}.mp3
    const recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${sid}.mp3`;

    try {
        const response = await fetch(recordingUrl, {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
            }
        });

        if (!response.ok) {
            console.error(`Failed to fetch recording: ${response.statusText}`);
            return new NextResponse('Failed to fetch recording', { status: response.status });
        }

        const blob = await response.blob();

        return new NextResponse(blob, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': blob.size.toString(),
            }
        });

    } catch (error) {
        console.error('Error fetching recording:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

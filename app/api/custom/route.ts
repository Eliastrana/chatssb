import {NextResponse} from 'next/server';
import {CustomAPIParams, ServerLog} from "@/app/types";
import {invokeHandler} from "@/app/custom/invokeHandler";

// TODO: This is a temporary in-memory store for sessions.
// Change to a proper database in production.
const sessions = new Map<string, CustomAPIParams>();

export async function POST(request: Request) {
    const body = await request.json() as CustomAPIParams;
    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, body);
    return NextResponse.json({ sessionId });
}

export async function GET(request: Request) {
    const url       = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId')!;
    const data    = sessions.get(sessionId);

    if (!data) {
        return NextResponse.json({ error: 'Unknown sessionId' }, { status: 400 });
    }
    
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            // Helper function to enqueue SSE-formatted messages
            const sendLog = (log: ServerLog) => {
                const content = log.content.replace(/\n/g, '\\n');
                const chunk = `event: ${log.eventType}\ndata: ${content}\n\n`;
                
                controller.enqueue(encoder.encode(chunk));
                
                if (log.eventType === 'pxData' || log.eventType === 'error' || log.eventType === 'abort') {
                    controller.close();
                }
            };

            try {
                sendLog({ content: 'Starting LLM response generation', eventType: 'log' });
                
                await invokeHandler(data, sendLog);
            } catch (error) {
                //Denne måtte være med for å kunne builde, men som du sier, så kommer den jo ikke til
                // å utløses, siden koden er programmert til å fungere.
                console.error(error);
                sendLog({ content: "Error found in backend API", eventType: 'error' });
                controller.close();
            }
            controller.close()
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
        }
    });
}

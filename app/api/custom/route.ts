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
    
    console.log(JSON.stringify(data, null, 2));
    
    
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            // Helper function to enqueue SSE-formatted messages
            const sendLog = (log: ServerLog) => {
                const content = log.content.replace(/\n/g, '\\n');
                const chunk = `event: ${log.eventType}\ndata: ${content}\n\n`;
                
                controller.enqueue(encoder.encode(chunk));
            };

            try {
                sendLog({ content: 'Starting LLM response generation', eventType: 'log' });
                
                const result = await invokeHandler(data, sendLog);
                
                sendLog({ content: JSON.stringify(result), eventType: 'final' });
                controller.close();
                
            } catch (error) {
                //Denne måtte være med for å kunne builde, men som du sier, så kommer den jo ikke til
                // å utløses, siden koden er programmert til å fungere.
                console.error(error);
                sendLog({ content: "Error found in backend API", eventType: 'error' });
            }
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

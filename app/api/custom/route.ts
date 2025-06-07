import {NextResponse} from 'next/server';
import {CustomAPIParams, ServerLog} from "@/app/types";
import {invokeHandler} from "@/app/custom/invokeHandler";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const params: CustomAPIParams = {
        userMessage: searchParams.get('userMessage') || '',
    };
    
    console.log(params);

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
                
                const result = await invokeHandler(params, sendLog);
                
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

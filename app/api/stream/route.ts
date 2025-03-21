// app/api/stream/route.ts
import { NextResponse } from 'next/server';
import {userRequestToLLMResponse} from "@/app/services/userRequestToLLMResponse";
import {ServerLog} from "@/app/types";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userMessage = searchParams.get('userMessage') || '';
    const isDevMode = searchParams.get('dev') === 'true' || false;
    
    console.log(`Server received userMessage: ${userMessage}`);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            // Helper function to enqueue SSE-formatted messages
            const sendLog = (log: ServerLog) => {
                if (!isDevMode && log.eventType === 'log') return;
                
                const content = log.content.replace(/\n/g, '\\n');
                const chunk =
                    log.eventType === 'final'
                        ? `event: final\ndata: ${content}\n\n`
                        : `event: ${log.eventType}\ndata: ${content}\n\n`;
                controller.enqueue(encoder.encode(chunk));
            };

            try {
                sendLog({ content: 'Starting LLM response generation', eventType: 'log' });
                const result = await userRequestToLLMResponse(userMessage, sendLog);
                // Send the final JSON result as an SSE event named "final"
                sendLog({ content: JSON.stringify(result), eventType: 'final' });
                controller.close();
                
            } catch (error: any) {
                controller.error(error);
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

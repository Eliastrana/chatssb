// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { message } = await request.json();

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required.' },
                { status: 400 }
            );
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: message },
            ],
            max_tokens: 300,
            temperature: 0.7,
        });

        // Safely access the bot's message content with a default fallback
        const botMessage = completion.choices[0].message?.content.trim() ?? 'No response from the bot.';

        return NextResponse.json({ message: botMessage });
    } catch (error: unknown) {
        // Enhanced error logging
        if (error instanceof OpenAI.APIError) {
            console.error('OpenAI API Error:', {
                message: error.message,
                status: error.status,
                code: error.code,
                type: error.type,
            });
        } else if (error instanceof Error) {
            console.error('General Error:', error.message);
        } else {
            console.error('Unexpected Error:', error);
        }

        // For debugging purposes, you can send the error message to the client.
        // **Note:** Remove or modify this in production to avoid exposing sensitive information.
        return NextResponse.json(
            { error: 'An error occurred while processing your request.' },
            { status: 500 }
        );
    }
}

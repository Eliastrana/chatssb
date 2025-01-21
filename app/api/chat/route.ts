import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Create OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


async function fetchFileContentFromOpenAI(fileId: string): Promise<string> {
    const response = await fetch(`https://api.openai.com/v1/files/${fileId}/content`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
    });

    if (!response.ok) {
        throw new Error(
            `Failed to fetch file content from OpenAI. Status: ${response.status} ${response.statusText}`
        );
    }

    return await response.text();
}

const OPENAI_UPLOADED_FILE_ID = process.env.NEXT_PUBLIC_OPENAI_UPLOADED_FILE_ID;


export async function POST(request: Request) {
    try {
        const { message } = await request.json() as { message: string };

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required.' },
                { status: 400 }
            );
        }



        if (!OPENAI_UPLOADED_FILE_ID) {
            throw new Error('Environment variable NEXT_PUBLIC_OPENAI_UPLOADED_FILE_ID is not set.');
        }

        const uploadedFileContent = await fetchFileContentFromOpenAI(OPENAI_UPLOADED_FILE_ID);


        const finalPrompt = `
            Alle emnekodetaggene er egne api-slug som legges oppå følgende:
            'https://data.ssb.no/api/v0/no/table/'

            En statistikksamling vil da se slik ut:
            https://data.ssb.no/api/v0/no/table/<emnekode>/<emnekode>/<kortnavn>


            Returner BARE api-kallet som tilsier statistikksamlingen for akvakultur.

            -- CONTENT FROM UPLOADED FILE STARTS --
            ${uploadedFileContent}
            -- CONTENT FROM UPLOADED FILE ENDS --
        `;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: finalPrompt },
                { role: 'user', content: message },
            ],
            max_tokens: 16000,
            temperature: 0,
        });

        const botMessage =
            completion.choices?.[0]?.message?.content?.trim() ??
            'No response from the bot.';

        return NextResponse.json({ message: botMessage });
    } catch (error: unknown) {
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

        return NextResponse.json(
            { error: 'An error occurred while processing your request.' },
            { status: 500 }
        );
    }
}

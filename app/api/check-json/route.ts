// app/api/check-json/route.ts

import { NextResponse } from 'next/server';

interface CheckJsonRequestBody {
    url: string;
}

interface CheckJsonResponse {
    isJson: boolean;
    error?: string;
}

export async function POST(request: Request) {
    try {
        const { url } = (await request.json()) as CheckJsonRequestBody;

        if (!url) {
            return NextResponse.json(
                { isJson: false, error: 'URL is required.' },
                { status: 400 }
            );
        }

        // Validate URL
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
        } catch (err) {
            return NextResponse.json(
                { isJson: false, error: 'Invalid URL format.' },
                { status: 400 }
            );
        }

        // Fetch the URL
        const response = await fetch(parsedUrl.toString());

        // Check if response is OK
        if (!response.ok) {
            return NextResponse.json(
                { isJson: false, error: `Failed to fetch URL. Status: ${response.status}` },
                { status: response.status }
            );
        }

        // Check Content-Type header
        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('application/json')) {
            return NextResponse.json({ isJson: true });
        }

        // Alternatively, attempt to parse JSON
        try {
            await response.json();
            return NextResponse.json({ isJson: true });
        } catch (err) {
            return NextResponse.json({ isJson: false, error: 'Response is not valid JSON.' });
        }
    } catch (error: unknown) {
        console.error('Error in /api/check-json:', error);
        return NextResponse.json(
            { isJson: false, error: 'An internal error occurred.' },
            { status: 500 }
        );
    }
}

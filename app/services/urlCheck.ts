'use client';
/**
 * /app/services/urlCheck.ts
 *
 * Provide function to check whether a URL returns JSON.
 */

export async function checkIfJsonUrl(url: string): Promise<boolean> {
    const encodedUrl = encodeURIComponent(url);

    // Call your internal Next.js API route to test the content-type
    // If you prefer, you can inline this logic, but putting it in a service is sometimes cleaner
    const response = await fetch(`/api/check-json?url=${encodedUrl}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        // If the route returns an error or 404
        return false;
    }

    const data = await response.json();
    return data.isJson;
}

'use client';
import { find } from 'linkifyjs';
import { checkIfJsonUrl } from '@/app/services/urlCheck';
import { Link } from '@/app/types';


export function extractUrls(text: string): string[] {
    const links = find(text, 'url');
    return links.map((link: Link) => link.href);
}

export async function filterJsonLinks(urls: string[]): Promise<string[]> {
    const jsonUrls: string[] = [];

    for (const url of urls) {
        try {
            const isJson = await checkIfJsonUrl(url);
            if (isJson) {
                jsonUrls.push(url);
            }
        } catch (err) {
            console.error(`Failed to check JSON for URL ${url}:`, err);
        }
    }
    return jsonUrls;
}

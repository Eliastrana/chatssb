'use client';

export function parseLinksFromJson(value: unknown): string[] {
    let links: string[] = [];

    if (typeof value === 'string') {
        if (value.startsWith('http')) {
            links.push(value);
        }
    } else if (Array.isArray(value)) {
        for (const item of value) {
            links = links.concat(parseLinksFromJson(item));
        }
    } else if (typeof value === 'object' && value !== null) {
        for (const key in value) {
            links = links.concat(parseLinksFromJson((value as Record<string, unknown>)[key]));
        }
    }
    return links;
}

/**
Her utfører den parsningen av de 5 sifrene for å bruke de i POST
 */
export function parseSsbSubItems(value: unknown) {
    const results: { tableId?: string; label: string }[] = [];
    const tableIdPattern = /^(\d{5})\s*:\s*/;

    if (Array.isArray(value)) {
        for (const item of value) {
            if (item && typeof item === 'object') {
                const record = item as Record<string, unknown>;

                if (record.type === 't' && typeof record.text === 'string') {
                    const textValue = record.text.trim();
                    const match = textValue.match(tableIdPattern);

                    let tableId: string | undefined = undefined;
                    if (match) {
                        tableId = match[1]; // De 5 sifrene i tittel
                    }

                    results.push({ tableId, label: textValue });
                }
            }
        }
    }
    return results;
}

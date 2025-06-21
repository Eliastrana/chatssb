import {SSBTableMetadata} from "@/app/types";

/**
 * Returns a human-readable string describing the table, including label, id, notes, and all dimensions with their values and units.
 */
export function buildTableDescription(metadata: SSBTableMetadata, limit = 100): string {
    const tab = `    `;
    const lines: string[] = [];
    lines.push(`Table: ${metadata.label}`);
    if (metadata.note && metadata.note.length > 0) {
        lines.push(tab + 'Notes:');
        metadata.note.forEach((n) => lines.push(`${tab}${tab}- ${n}`));
    }
    lines.push(tab + 'Variables:');
    const dimensions = metadata.dimension;
    const half = Math.floor(limit / 2);
    for (const [key, value] of Object.entries(dimensions)) {
        const items = Object.entries(value.category.label);
        lines.push(`${tab}${tab}${key}: ${value.label} (${items.length} values, optional: ${value.extension.elimination})`);
        const slice = items.length > limit
            ? [
                ...items.slice(0, half),
                [`...(${items.length - limit} more)...`, ''],
                ...items.slice(items.length - half)
            ]
            : items;
        slice.forEach(([label, index]) => {
            const unit = value.category.unit?.[label];
            lines.push(`${tab}${tab}${tab}${label}: ${index}${unit ? ` (${unit.base}, decimals: ${unit.decimals})` : ''}`);
        });
    }
    return lines.join('\n');
}

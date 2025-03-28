import {SelectionParamaters, ServerLog, SSBTableMetadata} from "@/app/types";

export function secureSchemaSinglethreadedRunnableToURL(
    response: Record<string, SelectionParamaters>,
    url: string,
    metadata: SSBTableMetadata,
    sendLog: (log: ServerLog) => void
): string {
    // Key for each dimension/value-code and the value is the item selection
    Object.entries(response).forEach(([key, value]) => {
        if (value.itemSelection) {
            const filteredValues = value.itemSelection.filter(item => metadata.dimension[key].category.label[item]);
            if (filteredValues.length !== value.itemSelection.length) {
                sendLog({ content: `Invalid item selection for ${key}: ${value.itemSelection} => ${filteredValues}`, eventType: 'log' });
            }
            if (filteredValues.length === 0) {
                url += `&valueCodes[${key}]=*`;
            } else {
                const selection = filteredValues.join(",");
                url += `&valueCodes[${key}]=${selection}`;
            }
        } else if (value.wildcard) {
            url += `&valueCodes[${key}]=*`;
        } else if (value.top) {
            url += `&valueCodes[${key}]=[TOP(${value.top.n}` + (value.top.offset ? `,${value.top.offset})]` : ")]");
        } else if (value.bottom) {
            url += `&valueCodes[${key}]=[BOTTOM(${value.bottom.n}` + (value.bottom.offset ? `,${value.bottom.offset})]` : ")]");
        } else if (value.range) {
            if (!metadata.dimension[key].category.label[value.range.start] && !metadata.dimension[key].category.label[value.range.end]) {
                sendLog({ content: `Invalid range selection for ${key}: ${value.range.start}-${value.range.end}`, eventType: 'log' });
                url += `&valueCodes[${key}]=*`;
            } else if (!metadata.dimension[key].category.label[value.range.start]) {
                sendLog({ content: `Invalid range start selection for ${key}: ${value.range.start}`, eventType: 'log' });
                url += `&valueCodes[${key}]=[TO(${value.range.end})]`;
            } else if (!metadata.dimension[key].category.label[value.range.end]) {
                sendLog({ content: `Invalid range end selection for ${key}: ${value.range.end}`, eventType: 'log' });
                url += `&valueCodes[${key}]=[FROM(${value.range.start})]`;
            } else {
                url += `&valueCodes[${key}]=[RANGE(${value.range.start},${value.range.end})]`;
            }
        } else if (value.from) {
            if (!metadata.dimension[key].category.label[value.from]) {
                sendLog({ content: `Invalid from selection for ${key}: ${value.from}`, eventType: 'log' });
                url += `&valueCodes[${key}]=*`;
            } else {
                url += `&valueCodes[${key}]=[FROM(${value.from})]`;
            }
        } else if (value.to) {
            if (!metadata.dimension[key].category.label[value.to]) {
                sendLog({ content: `Invalid to selection for ${key}: ${value.to}`, eventType: 'log' });
                url += `&valueCodes[${key}]=*`;
            } else {
                url += `&valueCodes[${key}]=[TO(${value.to})]`;
            }
        }
    });

    return url;
}

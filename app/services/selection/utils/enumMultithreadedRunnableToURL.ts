import {SelectionParamaters, ServerLog} from "@/app/types";

export function enumMultithreadedRunnableToURL(
    respones: Record<string, Record<string, SelectionParamaters>>,
    url: string,
    sendLog: (log: ServerLog) => void
): string {
    Object.entries(respones).forEach(([, responseValue]) => {
        Object.entries(responseValue).forEach(([key, value]) => {
            if (value.itemSelection) {
                // Join the selections into a comma-separated string
                const selection = value.itemSelection.join(",");
                sendLog({ content: `Selection for ${key}: ${selection}`, eventType: 'log' });
                url += `&valueCodes[${key}]=${selection}`;
            } else if (value.wildcard || value.exactMatch) {
                const expression = value.wildcard ?? value.exactMatch;
                sendLog({ content: `Expression for ${key}: ${expression}`, eventType: 'log' });
                url += `&valueCodes[${key}]=${expression}`;
            } else if (value.top) {
                sendLog({ content: `Top for ${key}: ${value.top.n}`, eventType: 'log' });
                url += `&valueCodes[${key}]=[TOP${value.top.n}` + (value.top.offset ? `,${value.top.offset}]` : "]");
            } else if (value.bottom) {
                sendLog({ content: `Bottom for ${key}: ${value.bottom.n}`, eventType: 'log' });
                url += `&valueCodes[${key}]=[BOTTOM${value.bottom.n}` + (value.bottom.offset ? `,${value.bottom.offset}]` : "]");
            } else if (value.range) {
                sendLog({ content: `Range for ${key}: ${value.range.start} to ${value.range.end}`, eventType: 'log' });
                url += `&valueCodes[${key}]=[RANGE(${value.range.start},${value.range.end})]`;
            } else if (value.from) {
                sendLog({ content: `From for ${key}: ${value.from}`, eventType: 'log' });
                url += `&valueCodes[${key}]=[FROM(${value.from})]`;
            } else if (value.to) {
                sendLog({ content: `To for ${key}: ${value.to}`, eventType: 'log' });
                url += `&valueCodes[${key}]=[TO(${value.to})]`;
            }
        });
    });

    return url;
}
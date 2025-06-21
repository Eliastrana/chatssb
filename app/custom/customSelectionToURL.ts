import {SelectionParamaters, ServerLog, SSBTableMetadata} from "@/app/types";

export function customSelectionToURL(
    response: Record<string, SelectionParamaters>,
    url: string,
    metadata: SSBTableMetadata,
    codeLists: Record<string, string>,
    sendLog: (log: ServerLog) => void,
): string {
    // Key for each dimension/value-code and the value is the item selection
    Object.entries(response).forEach(([key, value]) => {
        
        if (Object.keys(codeLists).includes(key) && codeLists[key] !== 'INCLUDED') {
            url += `&codeList[${key}]=${codeLists[key]}`;
        }
        
        url += `&valueCodes[${key}]=`
        
        if (value.itemSelection) {
            const filteredValues = value.itemSelection.filter(item => metadata.dimension[key].category.label[item]);
            if (filteredValues.length !== value.itemSelection.length) {
                sendLog({ content: `Invalid item selection for ${key}: ${value.itemSelection} => ${filteredValues}`, eventType: 'log' });
            }
            if (filteredValues.length === 0) {
                url += `*`;
                sendLog({ content: `Vi klarte ikke å finne gyldige verdier for variabel: '${key}'. Alle mulige verdier i denne variabelen er derfor valgt.`, eventType: 'info' });
            } else {
                const selection = filteredValues.join(",");
                url += `${selection}`;
            }
        } else if (value.wildcard) {
            url += `*`;
        } else if (value.range) {
            if (!metadata.dimension[key].category.label[value.range.start] && !metadata.dimension[key].category.label[value.range.end]) {
                sendLog({
                    content: `Invalid range selection for ${key}: ${value.range.start}-${value.range.end}`,
                    eventType: 'log'
                });
                url += `*`;
            } else if (!metadata.dimension[key].category.label[value.range.start]) {
                sendLog({
                    content: `Invalid range start selection for ${key}: ${value.range.start}`,
                    eventType: 'log'
                });
                url += `[TO(${value.range.end})]`;
            } else if (!metadata.dimension[key].category.label[value.range.end]) {
                sendLog({
                    content: `Invalid range end selection for ${key}: ${value.range.end}`,
                    eventType: 'log'
                });
                url += `[FROM(${value.range.start})]`;
            } else {
                url += `[RANGE(${value.range.start},${value.range.end})]`;
            }
        }
    });

    return url;
}

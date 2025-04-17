import {SelectionParamaters} from "@/app/types";

export function enumMultiToURL(
    respones: Record<string, Record<string, SelectionParamaters>>,
    url: string,
): string {
    Object.entries(respones).forEach(([, responseValue]) => {
        Object.entries(responseValue).forEach(([key, value]) => {
            if (value.itemSelection) {
                // Join the selections into a comma-separated string
                const selection = value.itemSelection.join(",");
                url += `&valueCodes[${key}]=${selection}`;
            } else if (value.wildcard || value.exactMatch) {
                const expression = value.wildcard ?? value.exactMatch;
                url += `&valueCodes[${key}]=${expression}`;
            } else if (value.top) {
                url += `&valueCodes[${key}]=[TOP(${value.top.n}` + (value.top.offset ? `,${value.top.offset})]` : ")]");
            } else if (value.bottom) {
                url += `&valueCodes[${key}]=[BOTTOM(${value.bottom.n}` + (value.bottom.offset ? `,${value.bottom.offset})]` : ")]");
            } else if (value.range) {
                url += `&valueCodes[${key}]=[RANGE(${value.range.start},${value.range.end})]`;
            } else if (value.from) {
                url += `&valueCodes[${key}]=[FROM(${value.from})]`;
            } else if (value.to) {
                url += `&valueCodes[${key}]=[TO(${value.to})]`;
            }
        });
    });

    return url;
}
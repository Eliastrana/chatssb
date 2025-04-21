import {SelectionParamaters} from "@/app/types";

export function expressionSingleToURL(
    response: Record<string, SelectionParamaters>,
    url: string,
): string {
    Object.entries(response).forEach(([key, value]) => {
        if (value.itemSelection) {
            // Join the selections into a comma-separated string
            const selection = value.itemSelection.join(",");
            url += `&valueCodes[${key}]=${selection}`;
        } else if (value.selectionExpression) {
            url += `&valueCodes[${key}]=[${value.selectionExpression}]`;
        }
    });

    return url;
}
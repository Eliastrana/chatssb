import {SelectionParamaters} from "@/app/types";

export function expressionMultiToURL(
    responses: Record<string, Record<string, SelectionParamaters>>,
    url: string,
): string {
    // Iterate over the top-level keys in the responses object
    Object.entries(responses).forEach(([, responseValue]) => {
        // Each responseValue is itself an object that we need to iterate over
        Object.entries(responseValue).forEach(([key, value]) => {
            if (value.itemSelection) {
                // Join the selections into a comma-separated string
                const selection = value.itemSelection.join(",");
                url += `&valueCodes[${key}]=${selection}`;
            } else if (value.selectionExpression) {
                // Process each selection expression
                value.selectionExpression.forEach((expression: string) => {
                    url += `&valueCodes[${key}]=[${expression}]`;
                });
            } else {
                // If neither itemSelections nor selectionExpressions are defined, use a wildcard
                url += `&valueCodes[${key}]=*`;
            }
        });
    });

    return url;
}
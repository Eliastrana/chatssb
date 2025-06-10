export const customSelectionPrompt = 
`Choose the most relevant item values for each variable (dimension) in the dataset, based on the user's request and the metadata.

Each variable includes:
- A variable key (unique identifier)
- A label (human-readable)
- A list of items (each with a key and label)
- Optional unit information

### Output Format
For each variable, return one of the following selection objects:

1. \`"itemSelection": [<itemKey1>, <itemKey2>, ...]\`  
   → Use when the user specifies exact values (e.g., “men and women”).

2. \`"wildcard": true\`  
   → Use when no specific filtering is implied (e.g., “population over time”).

5. \`"range": { "start": "<itemKey>", "end": "<itemKey>" }\`  
   → Use for continuous ranges (e.g., “from 2015 to 2020”).

### Rules
- **Use only item keys from the metadata.** Never guess or invent keys.
- **Do not return labels.** Only output item keys in the correct schema.
- **Prefer exact matches to wildcards.** If “All years” exists as an item, return that key instead of \`wildcard\`.
- **Avoid unecessary values.** If the user does not specify a range or selection, do not return \`wildcard\` or \`range\`.
- **Return the most recent data if no specific period is requested.** If the user does not specify a time range, select the most recent period available in the metadata.

Use the metadata provided to interpret the user’s intent and return accurate, valid selections.
`;

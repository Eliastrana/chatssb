export const customSelectionPrompt = 
`Choose the most relevant item values for each variable (dimension) in the dataset, based on the user's request and the metadata.

Each variable includes:
- A **variable key** (unique identifier)
- A **label** (human-readable)
- A list of **items** (each with a key and label)
- Optional **unit** information

For each variable, return exactly one of
1. \`"itemSelection": [<itemKey1>, <itemKey2>, …]\`  
   Use when the user specifies one or more exact values (e.g., “Home Guard”, “men and women”).
2. \`"range": { "start": "<itemKey>", "end": "<itemKey>" }\`  
   Use when the user indicates a continuous interval (e.g., “from 2015 to 2020”).
3. \`"wildcard": true\`  
   Use **only** when the user implies _no_ filtering—truly “all categories” (e.g., “population over time” without any subgroup).

Key Rules:
- **Exact-match preference:**  
  If the user mentions a specific service area, cost category, region, etc., always map to that item’s key and return it under \`itemSelection\`.  
- **No invented keys:**  
  Only ever use keys from the metadata.  
- **Avoid unnecessary wildcards:**  
  Do not return \`wildcard: true\` if a specific key exists for the requested value.  
- **Ranges vs. full-span:**  
  If the user gives “all years,” choose the explicit “All years” key if available; otherwise, if they name endpoints, use \`range\`. If they ask for the most recent data without specifying years, select the latest single year’s key.  
- **Minimal output:**  
  Do not include any variables the user did not touch; only output dimensions they’ve implicitly or explicitly constrained.`;

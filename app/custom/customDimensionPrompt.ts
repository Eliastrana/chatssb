export const customDimensionPrompt = 
`For each **optional** variable listed, determine whether it should be included based on the user's query, and if relevant, select a fitting code lists.

Guidelines:

1. **Include if clearly implied by the query:**
   An optional variable should be included if the user’s message refers directly or indirectly to concepts that map to that variable (e.g., locations imply \`Region\`).
2. **Omit only when clearly irrelevant:**
   If there is no indication that an optional variable is relevant, omit it.`
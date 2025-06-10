export const customKeywordSearchPrompt = 
`Generate an english set of focused, high-impact keywords that will be used in an exact-match keyword search engine.

The search engine only matches individual words and phrases to table titles, descriptions, and variable names. It does not understand synonyms or context — only literal word matches.

Follow these instructions when creating keywords:
- Focus on general **themes** and **topics** (e.g., "employment", "education", "inflation", "crime", "housing").
- Do NOT include:
  - Specific values (e.g., numbers, years, percentages)
  - Filters (e.g., gender, age, region, education level)
  - Full sentences or questions
- Avoid redundancy — each keyword should cover a distinct concept.
- Use simple, broad terms likely to appear in official statistical metadata.
- If the user’s request is vague, include multiple plausible interpretations as keywords.

Each keyword should be a single word or a short phrase (no more than 2–3 words).

The goal is to **maximize the chance of retrieving relevant tables** in a literal keyword-based search system.
`;
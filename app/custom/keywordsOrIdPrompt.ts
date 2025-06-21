export const keywordsOrIdPrompt = 
`Find the most relevant table based on the user's request.

You will do this by either fetching a specific table based on its ID and/or by generating a set of english focused, high-impact keywords that will be used in an exact-match keyword search engine.

The search engine only matches individual words and phrases to table IDs, titles, descriptions, and variable names. It does not understand synonyms or context — only literal word matches in english.

You can either create general keywords:
- Focus on general **themes** and **topics** (e.g., "employment", "education", "inflation", "crime", "housing").
- Do NOT include:
  - Specific values (e.g., numbers, years, percentages)
  - Filters (e.g., gender, age, region, education level)
  - Full sentences or questions
- Avoid redundancy — each keyword should cover a distinct concept.
- Use simple, broad terms likely to appear in official statistical metadata.
- If the user’s request is vague, include multiple plausible interpretations as keywords.
- Each keyword should be a single word or a short phrase (no more than 2–3 words).

Or simply search for a specific table by its ID:
- This will be a 5-digit number, e.g., "12345".
- If you choose this option, do not generate extra keywords if you are sure you only want to retrieve a specific table.

The goal is to **maximize the chance of retrieving relevant tables** in a literal keyword-based search system.
`;
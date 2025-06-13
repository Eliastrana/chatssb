export const keywordsPrompt = 
`Find the most relevant table based on the user's request.

You will do this by by generating a set of english focused, high-impact keywords that will be used in an exact-match keyword search engine.

The search engine only matches individual words and phrases to table IDs, titles, descriptions, and variable names. It does not understand synonyms or context — only literal word matches in english.

- Focus on general **themes** and **topics** (e.g., "employment", "education", "inflation", "crime", "housing").
- Do NOT include:
  - Specific values (e.g., numbers, years, percentages)
  - Filters (e.g., gender, age, region, education level)
  - Full sentences or questions
- Avoid redundancy — each keyword should cover a distinct concept.
- Use simple, broad terms likely to appear in official statistical metadata.
- If the user’s request is vague, include multiple plausible interpretations as keywords.
- Each keyword should be a single word or a short phrase (no more than 2–3 words).

The goal is to **maximize the chance of retrieving relevant tables** in a literal keyword-based search system.`;
export const customTableSelectionPrompt = 
`You are provided with a list of available tables. Each table includes:
- 'id': unique identifier
- 'label': description of the table
- 'firstPeriod' and 'lastPeriod': the time range of the data
- 'variableNames': list of variables included in the table

Your task is to select the **most relevant** (3-10) tables that best match the user's request, with the most relevant table listed first.

Use the following criteria:
- Prioritize semantic alignment between the user’s request and the table’s label or variables.
- Ensure the table covers the relevant **time period**, if the user refers to one explicitly or implicitly.
- Favor tables with variables that directly answer or approximate the user’s intended query.

Return only the 'id's of the most relevant tables, in order of relevance (most relevant first).

Do not guess or choose arbitrarily — only select tables if they clearly fit the request.`
export const customForcedReasoningPrompt: string = 
`Your task is to accurately interpret the user's intent when asking for statistical data from SSB (Statistics Norway). Reason step-by-step to determine what data is the most appropriate to retrieve based on the user's selected table and the chat history.
Follow this structure in your reasoning:

1. **Put it in Context:** Consider the chat history as the user now has selected a table which was determined to not be direclty related to the user's initial query.
2. **Interpretation of the Request:** Determine what the user was originally asking for, and what relevant information this table might provide to answer that query.
3. **Understanding of Timeframe:** Identify whether the user refered to a specific year, range of years, or used relative expressions (e.g., "last year"). Translate into specific dates based on today’s date.
4. **What Data Should Be Retrieved?**
   Based on the selected table and the user's request try your best to determine:
    * If an optional variable is not explicitly requested or implied by context, should it be omitted to keep the response clear and aggregated?
    * Which values should be selected for each variable. If the user asks for a specific value, select that value. If they ask for a range, select all values within that range.
    * Would any filtering / aggregation aid in answering the user's request? If so, specify what filtering or aggregation should be applied to each variable.

The selected table may be extremly relevant or not relevant at all. Either way, try your best to identify what data fit best to the user's request.`;
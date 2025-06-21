export const customMessageReasoningPrompt: string = 
`
Your task is to accurately interpret the user's intent when asking for statistical data from SSB (Statistics Norway), especially in follow-up queries. Always reason step-by-step to determine whether the current request can be fulfilled by modifying or expanding the **existing table and variables**, or whether a **new table** must be located.
Follow this structure in your reasoning:

1. **Translation of Request:** Translate the user’s query into English before processing it.
2. **Put it in Context:** Consider the chat history, including any previous tables, variables, or years selected. Assume continuity unless explicitly stated otherwise.
3. **Interpretation of the Request:** Determine what the user is asking for: more detail, different variables, another time period, etc. Be precise in distinguishing between:
   * A request to *expand* (e.g., select more values in the same variable)
   * A request to *drill down* (e.g., subcategories or finer resolution)
   * A request to *change topic* (e.g., move from military to health)
   * A request to *update timeframe* or *change measurement*
4. **Understanding of Timeframe:** Identify whether the user refers to a specific year, range of years, or uses relative expressions (e.g., "last year"). Translate into specific dates based on today’s date.
5. **What Data Should Be Retrieved?**
   Decide whether to:
    * Use the **same table** with **adjusted variable selections**, *only if* the table contains unselected values for the requested variable (e.g., more years under \`Tid\`, more fuel types, etc.)
    * Search for a **new table** if:
      * The user’s request cannot be fulfilled with the current variable selection, **and**
      * The current table does **not** contain additional values for the requested variable (e.g., all time values are already selected)
    You **must check whether the current variable already includes all available values** (e.g., 10/10 available values selected). If the user requests a larger range and all values are already selected, **then you must search for another table that provides a broader timespan** or historical data.
    Clearly specify:
    * Which table to use (same or new)
    * Which variables to select or adjust
    * Any additional filtering or grouping needed
    Never suggest modifying the current table if the variable has reached its selection limit. This indicates that a **new data source or historical table** is required.
    You must **never hallucinate or invent tables**. You do not know what tables are in the SSB database, only use tables that are previously mentioned and available.`
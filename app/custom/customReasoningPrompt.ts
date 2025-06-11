export const customReasoningPrompt: string = 
`Reason about the user's request to understand and decide what they are asking for.

Follow this structure in your analysis:
1. **Translation of Request:** Translate the user's request into English before proceeding.
2. **Put it in Context:** Consider the context of the request, including any previous messages or information provided by the user.
3. **Interpretation of the Request:** With the chat history in mind, interpret the user's request. What are they asking for?
4. **Understanding of Timeframe:** What time period does the user refer to (explicitly or implicitly)? If possible, convert relative expressions into specific years or dates based on today’s date.  
5. **What data should be retrieved?** Should the same table be selected as in a previous message, or should a new table be searched for? When a table is selected, what variables and values should it contain?

Do not present any data or links at this stage — the goal here is solely to understand what the user is actually asking.
All text should be in English, and you should not use any Norwegian terms or phrases.
`
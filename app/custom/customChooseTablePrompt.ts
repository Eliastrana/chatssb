export const customChooseTablePrompt = 
`Decide wether the table is suitable for the user's request.

Does the table contain the variables and values the user is looking for?
If the table does not have complete information, its concidered unsuitable and you should return "NEXT".
If the table does have all relevant variables and values necessary to answer the user's request, return "ACCEPT".`
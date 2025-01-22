import { NextResponse } from 'next/server';
import {ChatOpenAI, OpenAI} from '@langchain/openai';
import { BufferMemory } from 'langchain/memory';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

// Helper: Fetch file content from OpenAI
async function fetchFileContentFromOpenAI(fileId: string): Promise<string> {
    const response = await fetch(`https://api.openai.com/v1/files/${fileId}/content`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
    });

    if (!response.ok) {
        throw new Error(
            `Failed to fetch file content from OpenAI. Status: ${response.status} ${response.statusText}`
        );
    }

    return await response.text();
}

const OPENAI_UPLOADED_FILE_ID = process.env.NEXT_PUBLIC_OPENAI_UPLOADED_FILE_ID;

// Initialize BufferMemory
const memory = new BufferMemory({
    returnMessages: true,
    inputKey: 'input',
    outputKey: 'output',
    memoryKey: 'history',
});

export async function POST(request: Request) {
    try {
        const { message } = (await request.json()) as { message: string };

        if (!message) {
            return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
        }

        if (!OPENAI_UPLOADED_FILE_ID) {
            throw new Error('Environment variable NEXT_PUBLIC_OPENAI_UPLOADED_FILE_ID is not set.');
        }

        // Fetch file content from OpenAI
        const uploadedFileContent = await fetchFileContentFromOpenAI(OPENAI_UPLOADED_FILE_ID);

        // Build our system prompt
        const systemPrompt = `
            Du skal finne den mest relevante tabellen som vi kan hente fra følgende api:
            'https://data.ssb.no/api/v0/no/table/'

            Hver tabell har en id og vi kan hente tabellen med følgende url:
            https://data.ssb.no/api/v0/no/table/<kortnavn>
            
            Du skal bare returnere url-er som er relevante til forespørselen.
            Bruk tabellenes beskrivelse for å identifisere hvilket tabeller som passer best.
                        
            Bare returner url. Har du flere url-er så skal de være skilt med en ny linje. 
            Ingen andre tegn skal inkluderes i svaret.

            Dette er strukturen av hele API-en:
            -- CONTENT FROM UPLOADED FILE STARTS --
            ${uploadedFileContent}
            -- CONTENT FROM UPLOADED FILE ENDS --
        `;

        // Create a ChatOpenAI model instance
        const chat = new OpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: 'gpt-4o-mini',
            temperature: 0,
            maxTokens: 16000,
        });

        // Prepare the prompt template
        const prompt = ChatPromptTemplate.fromMessages([
            new SystemMessage(systemPrompt),
            new MessagesPlaceholder('history'),
            new HumanMessage('{input}'),
        ]);

        // Load memory variables
        const memoryVariables = await memory.loadMemoryVariables({});

        // Create the chain with memory
        const chain = RunnableSequence.from([
            {
                input: (initialInput) => initialInput.input,
                memory: () => memoryVariables,
            },
            {
                input: (previousOutput) => previousOutput.input,
                history: (previousOutput) => previousOutput.memory.history,
            },
            prompt,
            chat,
        ]);

        // Invoke the chain with the user's message
        const response = await chain.invoke({ input: message });

        // Extract the bot's message
        const botMessage = response || 'No response from the bot.';

        // Save the context to memory
        await memory.saveContext({ input: message }, { output: botMessage });

        return NextResponse.json({ message: botMessage });
    } catch (error: unknown) {
        // Handle or log any errors
        console.error('Error:', error);

        return NextResponse.json(
            { error: 'An error occurred while processing your request.' },
            { status: 500 }
        );
    }
}

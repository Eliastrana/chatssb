import fs from "fs";
import OpenAI from "openai";

// Denne brukes bare for å laste opp filer til OpenAI, den er ikke en del av programmet.
// Legg til din egen nøkkel:
const openai = new OpenAI({ apiKey: "API NØKKEL HER" });


async function main() {
    const file = await openai.files.create({
        file: fs.createReadStream("structure_jsonl.jsonl"),
        purpose: "fine-tune"
    });

    console.log(file);
}

main();
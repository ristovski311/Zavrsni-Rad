require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const {PDFParse} = require('pdf-parse');
const { error } = require('console');

const hostname = '127.0.0.1';
const port = 8444;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json'
};

function readReqBody(req)
{
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on("error", reject);
    });
}

function TokenizeServerSide(text) {
    const parts = text.split(/(\s+)/);
    const tokens = [];
    let index = 0;
    for (const part of parts) {
        if (part === "" || /^\s+$/.test(part)) continue;
        tokens.push({ index, word: part });
        index++;
    }
    return tokens;
}

async function GetHighlights(text, percent)
{
    const tokens = TokenizeServerSide(text);
    const targetCount = Math.max(1, Math.round(tokens.length * (percent/100)));
    const numberedWords = tokens.map(t => `${t.index}:${t.word}`).join(" ");

    //const prompt = `You are given a numbered list of words from a document in this format: index:word. Read the whole text first. The words form a document text, it is a whole text split into tokens. Identify the ${targetCount} most important parts of the text, sentences or parts of sentences and respective words in those, the ones a reader should highlight as important for learning throughout the whole text. Respond with only and only a JSON array of the integer indices and nothing else. No explanation or comments! Words are: ${numberedWords}`;
    //const prompt = `I will send you academic lecture in textual format. I want you to highlight this lecture as if you were a student highlighting a paper textbook. Please highlight around ${percent}% of the text. Give me the json array of integers that represent the numeric indexes of the highlighted words in the text (first word has index 0, second 1...). Just return the json array, no comments or anything else! Text: ${text}`;
    
    const prompt = `Below is a numbered list of words from an academic lecture, in the format index:word.
    Act as a student highlighting key phrases in this text with a highlighter pen — you highlight in short continuous runs of words (phrases/clauses), not scattered single words.
    Highlight approximately ${percent}% of the total ${tokens.length} words this way.

    Respond with a JSON object of the exact form {"spans": [[startIndex, endIndex], [startIndex, endIndex], ...]}, where each pair is an inclusive start and end word index for one continuous highlighted run. Output nothing else.

    Words: ${numberedWords}`;

    // const response = await fetch("https://api.groq.com/openai/v1/chat/completions",
    //     {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json",
    //             "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    //         },
    //         body: JSON.stringify({
    //             model: "llama-3.3-70b-versatile",
    //             messages: [{ role: "user", content: prompt }],
    //             temperature: 0.2,
    //             max_completion_tokens: 4096,
    //             response_format: { type: "json_object" }
    //         })
    //     });

    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.CEREBRAS_API_KEY}`
        },
        body: JSON.stringify({
            model: "gemma-4-31b",
            messages: [{ role: "user", content: prompt }],
            temperature: 0,
            max_completion_tokens: 4096,
            response_format: { type: "json_object" }
        })
    });

    if(!response.ok)
    {
        const errText = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    if(choice.finish_reason === "length")
        throw new Error("Response was still truncated - shorter document please!")

    const parsed = JSON.parse(choice.message.content.trim());
    const spans = parsed.spans;
    
    if(!Array.isArray(spans))
        throw new Error("The reply from LLM is not an array");

    const indices = [];
    for(const [start, end] of spans)
    {
        for(let i = start; i <= end; i++) indices.push(i);
    }

    return indices;
}

const server = http.createServer(async (req, res) => {

    // Prvi route : pozivamo iz main_page.js fju za parsiranje teksta iz pdf-a
    if(req.url.startsWith("/api/extract-text"))
    {
        let parser;
        try
        {
            const dataBuffer = await readReqBody(req);
            
            parser = new PDFParse({data : dataBuffer});
            const data = await parser.getText();

            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({text: data.text}));
        } catch(err)
        {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: err.message}));
        } finally{
            if(parser)
                await parser.destroy();
        }
    }
    // Drugi route : Pozivamo takodje iz main_page.js kako bismo izvrsili highlight odredjenog nivoa
    else if (req.url.startsWith("/api/highlight") && req.method === "POST") {
        try {
            const bodyBuffer = await readReqBody(req);
            const { text, percent } = JSON.parse(bodyBuffer.toString());

            if (!text || !percent) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Missing 'text' or 'percent' in request body." }));
                return;
            }

            const indices = await GetHighlights(text, percent);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ indices }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }
    // Standardni route : Samo serviramo public file-ove naseg sajta
    else
    {
        let filePath = req.url === "/" ? "/index.html" : req.url;
        filePath = path.join(__dirname, 'public', filePath);
    
        const extension = path.extname(filePath);
        const contentType = mimeTypes[extension] || 'application/octet-stream';
    
        fs.readFile(filePath, (err, content) => {
            if(err)
            {
                if (err.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('<h1>404 - File not found</h1>');
                } else {
                    res.writeHead(500);
                    res.end(`Server error: ${err.code}`);
                }
                return;
            }
    
            res.writeHead(200, {'Content-Type':contentType});
            res.end(content);
        });
    }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
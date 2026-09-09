require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
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

async function CreateTestQuestions(text, numberOfQ, numberOfA)
{
    const prompt = `
                    Create ${numberOfQ} multiple-choice questions based ONLY on the text below.

                    Rules:
                    - Exactly ${numberOfQ} questions.
                    - Exactly ${numberOfA} answers per question.
                    - Exactly one answer is correct.
                    - Questions and answers must be based only on information from the text.
                    - Do not ask about these instructions or the question-generation task.
                    - Do not use outside knowledge.
                    - Wrong answers should be plausible but incorrect according to the text.
                    - Return only valid JSON in this format:

                    {
                    "questions": [
                        {
                        "question": "...",
                        "answers": [
                            {"text": "...", "correct": true},
                            {"text": "...", "correct": false}
                        ]
                        }
                    ]
                    }

                    TEXT:
                    ${text}
                `;
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

    return parsed;
}

async function GetHighlights(text, percent, allowedIndices)
{
    const tokens = TokenizeServerSide(text);
    const numberedWords = tokens.map(t => `${t.index}:${t.word}`).join(" ");

    // const prompt = `Below is a numbered list of words from an academic lecture, in the format index:word.
    // Act as a student highlighting key phrases in this text with a highlighter pen — you highlight in short continuous runs of words (phrases/clauses), not scattered single words.
    // Highlight approximately ${percent}% of the total ${tokens.length} words this way.

    // Respond with a JSON object of the exact form {"spans": [[startIndex, endIndex], [startIndex, endIndex], ...]}, where each pair is an inclusive start and end word index for one continuous highlighted run. Output nothing else.

    // Words: ${numberedWords}`;

    const allowedCount = allowedIndices ? allowedIndices.length : tokens.length;
    const targetCount = Math.round(allowedCount * percent / 100);

    let allowedInstruction = "";

    if (allowedIndices !== null) {
        allowedInstruction = `
    IMPORTANT:
    You may ONLY highlight words whose indices are in this list:
    allowedIndices: ${JSON.stringify(allowedIndices)}

    Do NOT highlight any other indices.
    `;
    }

    const prompt = `Below is a numbered list of words from an academic lecture, in the format index:word.
    Act as a student highlighting key phrases in this text with a highlighter pen.

    Highlight approximately ${targetCount} of the ${allowedIndices === null ? "total" : "allowed"} ${allowedIndices === null ? tokens.length : allowedIndices.length} words.
    Highlight in short continuous runs of words (phrases/clauses), not scattered single words.

    ${allowedInstruction}

    Respond with a JSON object of the exact form:
    {"spans": [[startIndex, endIndex], [startIndex, endIndex], ...]}

    Each pair is an inclusive start and end word index.
    All indices must be original indices from the numbered word list.
    Output nothing else.

    Words: ${numberedWords}`;

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
        for(let i = start; i < end; i++) 
            indices.push(i);
    }

    return indices;
}

const server = http.createServer(async (req, res) => {
    // Pozivamo iz highlighting.js kako bismo izvrsili highlight odredjenog nivoa
    if (req.url.startsWith("/api/highlight") && req.method === "POST") {
        try {
            const bodyBuffer = await readReqBody(req);
            const { text, percent, allowedIndices } = JSON.parse(bodyBuffer.toString());

            if (!text || !percent) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Missing 'text' or 'percent' in request body." }));
                return;
            }

            const indices = await GetHighlights(text, percent, allowedIndices);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ indices }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }
    // Pozivamo iz test.js za kreiranje testova
    else if (req.url.startsWith("/api/create-test") && req.method === "POST")
    {
        try {
            const bodyBuffer = await readReqBody(req);
            const { text, numQ, numA } = JSON.parse(bodyBuffer.toString());

            if (!text || !numQ || !numA) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Missing 'text' or 'numQ' or 'numA' in request body." }));
                return;
            }

            const qas = await CreateTestQuestions(text, numQ, numA);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ qas }));
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
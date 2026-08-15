```js
const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

module.exports = async (req, res) => {
    try {

        // CORS
        const allowedOrigins = [
            "https://arisai1.netlify.app",
            "https://deploy.is"
        ];

        const origin = req.headers.origin;

        if (allowedOrigins.includes(origin)) {
            res.setHeader(
                "Access-Control-Allow-Origin",
                origin
            );
        }

        res.setHeader(
            "Access-Control-Allow-Methods",
            "POST, GET, OPTIONS"
        );

        res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type"
        );

        // CORS preflight
        if (req.method === "OPTIONS") {
            return res.status(204).end();
        }

        // GET test
        if (req.method === "GET") {
            return res.status(200).json({
                message: "ARIS AI chat API is online. Use POST to chat."
            });
        }

        // Read body
        let body = req.body || {};

        if (typeof body === "string") {
            try {
                body = JSON.parse(body);
            } catch {
                body = {};
            }
        }

        const userMessage =
            body.message ||
            body.prompt ||
            body.text;

        if (!userMessage) {
            return res.status(400).json({
                error: "No message provided"
            });
        }

        // Ask Groq with streaming
        const stream = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",

            messages: [
                {
                    role: "system",
                    content:
                        "You are ARIS, a helpful AI assistant created by Abdul Rehman. Always answer the user's latest question directly. If asked who created you, say: \"I was created by Abdul Rehman.\" Always answer in English. Be helpful, friendly, clear, and concise."
                },
                {
                    role: "user",
                    content: String(userMessage)
                }
            ],

            stream: true
        });

        res.setHeader(
            "Content-Type",
            "text/plain; charset=utf-8"
        );

        // Stream response to website
        for await (const chunk of stream) {

            const text =
                chunk.choices[0]?.delta?.content || "";

            if (text) {
                res.write(text);
            }
        }

        res.end();

    } catch (error) {

        console.error("ARIS ERROR:", error);

        if (!res.headersSent) {
            res.status(500).json({
                error: "ARIS could not connect to the AI."
            });
        } else {
            res.end();
        }
    }
};
```

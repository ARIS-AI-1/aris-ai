const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

module.exports = async (req, res) => {
    try {

        // CORS
        const origin = req.headers.origin;

        const allowedOrigins = [
            "https://arisai1.netlify.app",
            "https://deploy.is"
        ];

        if (allowedOrigins.includes(origin)) {
            res.setHeader(
                "Access-Control-Allow-Origin",
                origin
            );
        }

        res.setHeader(
            "Access-Control-Allow-Methods",
            "GET, POST, OPTIONS"
        );

        res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type"
        );

        // Browser preflight
        if (req.method === "OPTIONS") {
            return res.status(204).end();
        }

        // Test API
        if (req.method === "GET") {
            return res.status(200).json({
                message: "ARIS AI chat API is online. Use POST to chat."
            });
        }

        if (req.method !== "POST") {
            return res.status(405).json({
                error: "Method not allowed"
            });
        }

        // Get body
        let body = req.body;

        if (!body) {
            body = {};
        }

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

        // Get conversation history from website
        let history = Array.isArray(body.history)
            ? body.history
            : [];

        // Keep only the most recent messages
        history = history.slice(-20);

        // Build messages for Groq
        const messages = [
            {
                role: "system",
                content:
                    "You are ARIS, a helpful AI assistant created by Abdul Rehman. Use the conversation history to understand follow-up questions and context. Remember what the user was talking about earlier in the conversation. Always answer the user's latest question directly. If asked who created you, say: \"I was created by Abdul Rehman.\" Always answer in English. Be helpful, friendly, clear, and concise."
            },

            ...history,

            {
                role: "user",
                content: String(userMessage)
            }
        ];

        // Call Groq
        const stream = await groq.chat.completions.create({

            model: "llama-3.1-8b-instant",

            messages: messages,

            stream: true
        });

        res.setHeader(
            "Content-Type",
            "text/plain; charset=utf-8"
        );

        // Send response
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
            return res.status(500).json({
                error: "ARIS could not connect to the AI.",
                details: error.message
            });
        }

        res.end();
    }
};

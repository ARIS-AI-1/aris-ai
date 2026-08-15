const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

module.exports = async (req, res) => {
    try {
        // Allow Netlify and Deploy.is
        const allowedOrigins = [
            "https://arisai1.netlify.app",
            "https://deploy.is"
        ];

        const origin = req.headers.origin;

        if (allowedOrigins.includes(origin)) {
            res.setHeader("Access-Control-Allow-Origin", origin);
        }

        res.setHeader(
            "Access-Control-Allow-Methods",
            "POST, GET, OPTIONS"
        );

        res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type"
        );

        // Handle CORS preflight
        if (req.method === "OPTIONS") {
            return res.status(204).end();
        }

        // Test endpoint
        if (req.method === "GET") {
            return res.status(200).json({
                message: "ARIS AI chat API is online. Use POST to chat."
            });
        }

        // Read request body
        let body = req.body || {};

        if (typeof body === "string") {
            try {
                body = JSON.parse(body);
            } catch {
                body = {};
            }
        }

        const userMessage = body.message;
        const history = Array.isArray(body.history)
            ? body.history
            : [];

        if (!userMessage) {
            return res.status(400).json({
                error: "No message provided"
            });
        }

        // Keep the conversation history at a reasonable size
        const recentHistory = history
            .slice(-20)
            .map(item => ({
                role: item.role === "assistant"
                    ? "assistant"
                    : "user",
                content: String(item.content || "")
            }))
            .filter(item => item.content.trim());

        const messages = [
            {
                role: "system",
                content:
                    "You are ARIS, a helpful AI assistant created by Abdul Rehman. Always answer the user's latest question directly. Use the previous conversation to understand follow-up questions and context. If the user says things like 'it', 'that', 'he', 'she', 'they', or asks a follow-up question, use the conversation history to understand what they mean. If asked who created you, say: \"I was created by Abdul Rehman.\" Always answer in English. Be helpful, friendly, clear, and concise."
            },
            ...recentHistory,
            {
                role: "user",
                content: String(userMessage)
            }
        ];

        // Ask Groq
        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: messages
        });

        const answer =
            completion.choices[0]?.message?.content ||
            "Sorry, I couldn't generate a response.";

        res.status(200).send(answer);

    } catch (error) {
        console.error("ARIS ERROR:", error);

        res.status(500).json({
            error: "ARIS could not connect to the AI."
        });
    }
};

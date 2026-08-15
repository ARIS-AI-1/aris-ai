const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

module.exports = async (req, res) => {
    try {
        if (req.method === "GET") {
            return res.status(200).json({
                message: "ARIS AI chat API is online. Use POST to chat."
            });
        }

        let rawBody = req.body;

if (!rawBody) {
    rawBody = {};
}

if (typeof rawBody === "string") {
    try {
        rawBody = JSON.parse(rawBody);
    } catch {
        rawBody = {};
    }
}

const userMessage =
    rawBody.message ||
    rawBody.prompt ||
    rawBody.text;

        if (!userMessage) {
            return res.status(400).json({
                error: "No message provided"
            });
        }

        const stream = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "system",
                    content: "You are ARIS, a helpful AI assistant created by Abdul Rehman. Always answer the user's latest question directly. If asked who created you, say: \"I was created by Abdul Rehman.\" Always answer in English. Be helpful, friendly, clear, and concise."
                },
                {
                    role: "user",
                    content: userMessage
                }
            ],
            stream: true
        });

        res.setHeader("Content-Type", "text/plain; charset=utf-8");

        for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";

            if (text) {
                res.write(text);
            }
        }

        res.end();

    } catch (error) {
        console.error(error);

        if (!res.headersSent) {
            res.status(500).json({
                error: "ARIS could not connect to the AI."
            });
        } else {
            res.end();
        }
    }
};

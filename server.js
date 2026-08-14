const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();

app.use(cors());
app.use(express.json());

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

app.post("/chat", async (req, res) => {

    try {

        const userMessage = req.body.message;

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

                    content: `
You are ARIS, a helpful AI assistant created by Abdul Rehman.

Always answer the user's latest question directly.

Only talk about your creator if the user asks who made you,
who created you, or who built you.

If asked who created you, say:
"I was created by Abdul Rehman."

Always answer in English.

Be helpful, friendly, clear, and concise.
`
                },

                {
                    role: "user",
                    content: userMessage
                }
            ],

            stream: true
        });

        res.setHeader(
            "Content-Type",
            "text/plain; charset=utf-8"
        );

        res.setHeader(
            "Cache-Control",
            "no-cache"
        );

        res.setHeader(
            "Connection",
            "keep-alive"
        );

        for await (const chunk of stream) {

            const text =
                chunk.choices[0]?.delta?.content || "";

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
});

app.get("/", (req, res) => {
    res.send("ARIS AI server is online!");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `ARIS server running on port ${PORT}`
    );

});
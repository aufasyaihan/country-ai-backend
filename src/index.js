import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";

const app = express();

dotenv.config();

const port = process.env.PORT || 3000;
const openai = new OpenAI({
    apiKey: process.env.NVIDIA_NIM_API_KEY,
    baseURL: process.env.NVIDIA_NIM_BASEURL,
});

app.use(
    cors({
        origin: ["http://localhost:5173", "https://country-ai.vercel.app"],
        methods: "POST",
        allowedHeaders: "Content-Type,Authorization",
    })
);

app.use(express.json());

app.post("/chat", async (req, res) => {
    const { messages, context } = req.body;

    if (!messages || messages.length === 0) {
        return res.status(400).json({ error: "Messages history is required" });
    }

    const countryContext = context
        ? `You are speaking about the country: ${
              context.name
          }. The capital is ${context.capital}, the currency is ${
              context.currency
          }, and the primary language is ${context.languages
              ?.map((lang) => lang.name)
              .join(", ")}.`
        : "";

    const chatHistory = [
        { role: "system", content: countryContext },
        ...messages.map((msg) => ({ role: msg.role, content: msg.content })),
    ];

    try {
        const completion = await openai.chat.completions.create({
            model: "meta/llama-3.1-405b-instruct",
            messages: chatHistory,
            temperature: 0.2,
            top_p: 0.7,
            max_tokens: 1024,
            stream: true,
        });

        let responseContent = "";
        for await (const chunk of completion) {
            responseContent += chunk.choices[0]?.delta?.content || "";
        }

        res.json({ response: responseContent });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(port);

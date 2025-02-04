import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";
import { Languages, Message } from "../types/types";

const app = express();

dotenv.config();

const port = process.env.PORT || 3000;
const openai = new OpenAI({
    apiKey: process.env.NVIDIA_NIM_API_KEY,
    baseURL: process.env.NVIDIA_NIM_BASEURL,
});

app.use((_, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); 
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

app.use(cors());


app.use(express.json());

app.post("/chat", async (req: any, res: any) => {
    const { messages, context } = req.body;

    res.setTimeout(29000, () => { 
        res.status(504).json({ error: "Request timed out" });
    });

    if (!messages || messages.length === 0) {
        return res.status(400).json({ error: "Messages history is required" });
    }

    const countryContext = context
        ? `You are speaking about the country: ${
              context.name
          }. The capital is ${context.capital}, the currency is ${
              context.currency
          }, and the primary language is ${context.languages
              ?.map((lang: Languages) => lang.name)
              .join(", ")}.`
        : "";

    const chatHistory: Message[] = [
        { role: "system", content: countryContext },
        ...messages.map((msg: Message) => ({
            role: msg.role,
            content: msg.content,
        })),
    ];

    try {
        const completion = await openai.chat.completions.create({
            model: "meta/llama-3.1-405b-instruct",
            messages: chatHistory,
            temperature: 0.2,
            top_p: 0.7,
            max_tokens: 1024,
            stream: false,
        });

        let responseContent = "";
        responseContent += completion.choices[0]?.message?.content || "";

        res.json({ response: responseContent });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

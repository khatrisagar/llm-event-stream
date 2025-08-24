import express, { Request, Response } from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { chatMessageSchema } from "./validationSchema";
import { ZodError, ZodRealError } from "zod";
import { request } from "http";
require("dotenv").config();
const app = express();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

const supabase = createClient(supabaseUrl, supabaseKey);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(express.json());
app.use(cors());

app.get("/", (req: Request, res: Response) => {
  res.status(200).send("Ok");
});

app.post("/ask-ai", async (req: Request, res: Response) => {
  try {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: req.body.message,
    });

    res.status(200).json(response.text);
  } catch (error) {
    res.status(400).json((error as Error).message);
  }
});

app.post("/chat", async (req: Request, res: Response) => {
  try {
    const { success, data: requestData } = chatMessageSchema.safeParse(
      req.body
    );

    if (!success) {
      res.status(411).json({
        message: "Incorrect inputs",
      });
      return;
    }

    if (!requestData.chatId) {
      const { data, error } = await supabase
        .from("llm-chats")
        .insert({
          user_id: process.env.USER_ID,
          name: requestData.message.slice(0, 20),
        })
        .select("id")
        .single();
      requestData.chatId = data?.id;
    }

    // TODO:  fetch history when check for chatId exist or not and no need to fetch after creating new chat id
    // Throw errors properly

    const { data: chats, error } = await supabase
      .from("llm-chats-messages")
      .select("*")
      .eq("chat_id", requestData.chatId);

    const chatHistory = chats?.map((chat) => ({
      role: chat.role,
      parts: [{ text: chat.message }],
    }));

    const chat: any = ai.chats.create({
      model: "gemini-2.5-flash",
      history: chatHistory ?? [],
    });

    let fullResponse = "";

    const stream = await chat.sendMessageStream({
      message: req.body.message,
    });

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("X-Chat-Id", requestData.chatId ?? "");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Content-Type-Options", "nosniff");

    for await (const chunk of stream) {
      const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      res.write(`data: ${text.replace(/\n/g, "\\n")}\n\n`);
      fullResponse += text;
    }

    res.write("data: \n\n[Done]");

    const { data, error: addDataError } = await supabase
      .from("llm-chats-messages")
      .insert([
        {
          chat_id: requestData.chatId,
          role: "user",
          message: requestData.message,
        },
        {
          chat_id: requestData.chatId,
          role: "model",
          message: fullResponse,
        },
      ]);

    res.end();
  } catch (error) {
    res.status(400).json((error as Error).message);
  }
});

// Export the app for use in Vercel serverless function
export default app;

// If running locally, start the server
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// const chat: any = ai.chats.create({
//   model: "gemini-2.5-flash",
//   history: [
//     {
//       role: "user",
//       parts: [{ text: "what is ai in few words?" }],
//     },
//     // {
//     //   role: "user",
//     //   parts: [{ text: req.body.message }],
//     // },
//   ],
// });
// const stream1 = await chat.sendMessageStream({
//   message: req.body.message,
// });
// for await (const chunk of stream1) {
//   const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
//   res.write(text); // flush chunk as soon as it's available
// }

// res.end();

import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function askChatGPT(message, history = []) {
  const messages = [
    ...history,
    { role: "user", content: message }
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o-search-preview",
    messages,
    tools: [{ type: "web_search" }],
    tool_choice: "auto"
  });

  return response.choices[0].message.content;
}

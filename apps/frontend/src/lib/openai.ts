import OpenAI from "openai";

export const openaiModel = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

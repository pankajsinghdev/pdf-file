import { openaiModel } from "@/lib/openai";
import { pinecone } from "@/lib/pinecone";
import { SendMessageValidator } from "@/lib/validators/send-message-validator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { db } from "@repo/db/client";
import { NextRequest } from "next/server";
import { Message, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { readStreamableValue } from "ai/rsc";

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  const { id: userId } = user;
  if (!userId) return new Response("Unauthorized", { status: 400 });

  const { fileId, message } = SendMessageValidator.parse(body);

  const file = await db.file.findFirst({
    where: {
      id: fileId,
      userId,
    },
  });

  if (!file) return new Response("Not found", { status: 404 });

  await db.message.create({
    data: {
      text: message,
      isUserMessage: true,
      userId,
      fileId,
    },
  });

  const pineconeIndex = pinecone.index("pdffileindex");

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    namespace: file.key,
  });

  const results = await vectorStore.similaritySearch(message, 6);

  const prevMessages = await db.message.findMany({
    where: {
      fileId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  const formattedPrevMessages = prevMessages.map(
    (msg: {
      userId: string | null;
      fileId: string | null;
      id: string;
      createdAt: Date;
      updatedAt: Date;
      text: string;
      isUserMessage: boolean;
    }) => ({
      role: msg.isUserMessage ? ("user" as const) : ("assistant" as const),
      content: msg.text,
    })
  );

  const response = await openaiModel.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    stream: true,
    messages: [
      {
        role: "system",
        content: `You are a helpful AI assistant that analyzes PDF documents. Your task is to:
1. Carefully analyze the provided PDF content
2. If the question is about the document's content, provide a detailed answer based on the information found
3. If the question is about the document's type (e.g., "What is this PDF about?"), analyze the content to determine if it's a resume, report, article, etc.
4. If you cannot find relevant information in the provided context, respond with: "I couldn't find any relevant information in the PDF to answer your question. The PDF might not contain the information you're looking for."
5. Always provide your answers in markdown format for better readability.`,
      },
      {
        role: "user",
        content: `Analyze the following PDF content and answer the user's question. If you're unsure about the document type, look for key indicators in the content.

Previous conversation:
${formattedPrevMessages.map(
  (message: { role: "user" | "assistant"; content: string }) => {
    if (message.role === "user") return `User: ${message.content}\n`;
    return `Assistant: ${message.content}\n`;
  }
)}

PDF Content:
${results.map((r) => r.pageContent).join("\n\n")}

User Question: ${message}

Remember to:
1. If this is a general question about the document (like "What is this PDF about?"), analyze the content to determine the document type and provide a summary
2. If this is a specific question, search through the content for relevant information
3. If you can't find relevant information, clearly state that the PDF doesn't contain the information being asked for
4. Format your response in markdown for better readability`,
      },
    ],
  });

  let completionText = "";

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        const text = chunk.choices[0]?.delta?.content || "";
        completionText += text;
        controller.enqueue(new TextEncoder().encode(text));
      }

      await db.message.create({
        data: {
          text: completionText,
          isUserMessage: false,
          fileId,
          userId,
        },
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};

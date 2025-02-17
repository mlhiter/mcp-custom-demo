import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

import { systemPrompts } from "@/constants/prompts/system";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { userMessage, messageHistory } = await req.json();

    const openai = new OpenAI({
      baseURL: process.env.MODEL_BASE_URL,
      apiKey: process.env.MODEL_API_KEY,
    });
    const concatenatedUserContent = `
     My Ask: ${userMessage}
      My History: ${messageHistory.map((m: any) => m.content).join("\n")}
    `;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompts },
        { role: "user", content: concatenatedUserContent },
      ],
      model: "deepseek-chat",
    });

    const assistantMessage = completion.choices[0].message.content;

    if (!assistantMessage) {
      return NextResponse.json({ assistantMessage: "", isToolCall: false });
    }

    let isToolCall = false;
    try {
      const parsedMessage = JSON.parse(assistantMessage);
      isToolCall =
        parsedMessage.hasOwnProperty("tool") &&
        parsedMessage.hasOwnProperty("arguments") &&
        typeof parsedMessage.tool === "string" &&
        typeof parsedMessage.arguments === "object";
    } catch {
      isToolCall = false;
    }

    return NextResponse.json({
      isToolCall,
      assistantMessage: isToolCall
        ? JSON.parse(assistantMessage)
        : assistantMessage,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, currentContent, mode } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "AI configuration missing" }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    let finalPrompt = "";
    if (mode === "generate") {
      finalPrompt = `You are a LinkedIn content expert. Generate a professional and engaging LinkedIn post about: ${prompt}. Use appropriate emojis and line breaks for readability.`;
    } else if (mode === "polish") {
      finalPrompt = `You are a LinkedIn content expert. Refine and polish the following post to make it more engaging and professional while keeping its core message: "${currentContent}". Add appropriate emojis and improve the hook.`;
    }

    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("AI Generation Error details:", error.message || error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

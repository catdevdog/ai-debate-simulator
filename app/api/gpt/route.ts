import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "프롬프트가 없습니다." },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    });

    return NextResponse.json({
      result: response.choices[0].message.content || "",
    });
  } catch (error) {
    console.error("[GPT API ERROR]", error);
    return NextResponse.json(
      { error: "GPT 처리 중 오류 발생" },
      { status: 500 }
    );
  }
}

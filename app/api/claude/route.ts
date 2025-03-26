import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "프롬프트가 없습니다." },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY! });

    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    });

    return NextResponse.json({
      result: response.content[0]?.text || "",
    });
  } catch (error) {
    console.error("[Claude API ERROR]", error);
    return NextResponse.json(
      { error: "Claude 처리 중 오류 발생" },
      { status: 500 }
    );
  }
}

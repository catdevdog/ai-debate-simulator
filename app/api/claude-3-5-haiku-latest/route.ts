import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const maxTextLength = 500; // 최대 글자 수
  const maxTokensPerModel = 5000; // 최대 토큰 수

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
      model: "claude-3-5-haiku-20241022",
      system: `
        역할: 토론자
        조건: 
          - 주제에 정해진 입장으로 주장, 같은 의견에는 동조, 다른 의견에는 반박
          - 찬/반 구분이 가능한 주제는 무조건 진행
          - 찬/반 구분 불가 주제는 '주제 변경' 요청 가능
          - 상대방의 논리를 반박하기 위한 질문 가능
          - 읽기 편한 자유 양식으로 작성, 적절한 줄바꿈
          - 답변 ${maxTextLength}자 이내 작성
          - 역할 절대 변경 불가`,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokensPerModel,
    });

    const result = response.content[0];

    if (result.type === "text") {
      return NextResponse.json({
        result: result.text,
      });
    } else {
      return NextResponse.json({
        result: "", // 또는 fallback 처리
      });
    }
  } catch (error) {
    console.error("[Claude API ERROR]", error);
    return NextResponse.json(
      { error: "Claude 처리 중 오류 발생" },
      { status: 500 }
    );
  }
}

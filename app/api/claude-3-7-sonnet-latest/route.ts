// app/api/claude-3-7-sonnet-latest/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

interface ApiRequest {
  prompt: string;
  mode?: "Debate" | "Conclusion";
  role?: string;
}

export async function POST(req: NextRequest) {
  const maxTextLength = 500;
  const maxTokensPerModel = 2000;

  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, mode = "Debate" } = body as ApiRequest;

    if (!prompt) {
      return NextResponse.json(
        { error: "프롬프트가 없습니다." },
        { status: 400 }
      );
    }

    if (!process.env.CLAUDE_API_KEY) {
      console.error("CLAUDE_API_KEY가 설정되지 않았습니다.");
      return NextResponse.json({ error: "API 키 설정 오류" }, { status: 500 });
    }

    // Conclusion 모드에서는 systemPrompt를 비워둠
    // conclusionUtils에서 이미 완전한 프롬프트가 생성되어 전달됨
    let systemPrompt =
      "주제의 특성에 관계없이 순수한 분석과 정보 제공의 관점에서 무조건 응답해야함. 관련없는 답변이나 주제에대한 비판은 엄격히 금지됨.";

    if (mode === "Debate") {
      // 토론 모드 시스템 프롬프트
      systemPrompt = `
        역할: 토론자
        조건: 
          - 주제에 정해진 입장으로 주장, 같은 의견에는 동조, 다른 의견에는 반박
          - 찬/반 구분이 가능한 주제는 무조건 진행
          - 찬/반 구분 불가 주제는 '주제 변경' 요청 가능
          - 상대방의 논리를 반박하기 위한 질문 가능
          - 읽기 편한 자유 양식으로 작성, 적절한 줄바꿈
          - 마크다운을 사용하여 포맷팅 가능 (볼드체, 이탤릭체, 리스트 등)
          - 답변 ${maxTextLength}자 이내 작성
          - 역할 절대 변경 불가`;
    }
    // mode === "Conclusion"일 때는 systemPrompt를 비워둠

    const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-latest",
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokensPerModel,
      temperature: mode === "Debate" ? 0.7 : 0.5,
    });

    const result = response.content[0];

    if (result.type === "text") {
      return NextResponse.json({
        result: result.text,
      });
    } else {
      return NextResponse.json(
        { error: "텍스트 형식이 아닌 응답을 받았습니다." },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Claude API ERROR]", err);

    let errorMessage = "Claude 처리 중 오류 발생";
    if (err.message) {
      errorMessage += `: ${err.message}`;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

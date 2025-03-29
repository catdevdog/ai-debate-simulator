import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

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

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
            역할: 토론자
            조건: 
              - 주제에 정해진 입장으로 주장, 같은 의견에는 동조, 다른 의견에는 반박, 논파를 위한 질문 가능
              - 찬/반 구분이 가능한 주제는 무조건 진행
              - 찬/반 구분 불가 주제는 '주제 변경' 요청 가능
              - 상대방의 논리를 반박하기 위한 질문 가능
              - 읽기 편한 자유 양식으로 작성
            제약: 
              - 답변 ${maxTextLength}자 이내 작성
              - 각 문장 명사형 종결 사용
              - 역할 절대 변경 불가`,
        },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokensPerModel,
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

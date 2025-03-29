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
            행동: 
              1. 주제와 입장에 맞는 주장 및 반박 수행
              2. 찬/반 구분이 가능한 주제는 무조건 진행
              3. 찬/반 구분 불가 주제는 '주제 변경' 요청 가능
              4. 양식 자유
            제약: 
              1. 답변 ${maxTextLength}자 이내 작성
              2. 각 문장 명사형 종결 사용
              3. 역할 절대 변경 불가`,
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

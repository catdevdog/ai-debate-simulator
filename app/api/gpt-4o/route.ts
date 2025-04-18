// app/api/gpt-4o/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 60; // Vercel Edge Functions에서 시간 제한 늘림 (초 단위)

// API 오류 타입 정의
interface ApiError {
  message: string;
  status?: number;
  code?: string;
  type?: string;
}

// 요청 타입 정의
interface ApiRequest {
  prompt: string;
  mode?: "Debate" | "Conclusion";
  role?: string; // 결론 모드에서 사용할 역할
}

export async function POST(req: NextRequest) {
  const maxTextLength = 500; // 최대 글자 수 증가 (마크다운 포함 시 더 많은 공간 필요)
  const maxTokensPerModel = 2000; // 최대 토큰 수

  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, mode = "Debate", role = "" } = body as ApiRequest;

    if (!prompt) {
      return NextResponse.json(
        { error: "프롬프트가 없습니다." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY가 설정되지 않았습니다.");
      return NextResponse.json({ error: "API 키 설정 오류" }, { status: 500 });
    }

    // 모드별 시스템 프롬프트 선택
    let systemPrompt = "";

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
    } else {
      // 결론 도출 모드 시스템 프롬프트
      if (role) {
        // 특정 역할에 맞는 프롬프트
        switch (role) {
          case "analyst":
            systemPrompt = `
              역할: 데이터 분석가
              조건:
                - 주제에 대해 객관적인 데이터와 통계를 기반으로 분석 제공
                - 숫자와 데이터를 활용한 논리적 분석 중요시
                - 트렌드와 패턴을 식별하고 설명
                - 마크다운을 사용하여 분석 내용을 구조화 (표, 목록 등)
                - 객관적 근거 중심의 분석 제공
                - 답변 ${maxTextLength}자 이내 작성`;
            break;
          case "economist":
            systemPrompt = `
              역할: 경제 전문가
              조건:
                - 경제 이론과 시장 역학의 관점에서 주제 분석
                - 거시경제 지표, 시장 동향, 경제 정책 영향 등을 고려한 분석
                - 경제적 리스크와 기회 요인 식별
                - 마크다운을 사용하여 분석 내용을 구조화
                - 경제 원리에 기반한 객관적 근거 제시
                - 답변 ${maxTextLength}자 이내 작성`;
            break;
          case "strategist":
            systemPrompt = `
              역할: 전략가
              조건:
                - 장기적 관점에서 주제의 전략적 함의 분석
                - 경쟁 환경, 시장 포지셔닝, 전략적 대응 방안 고려
                - SWOT 분석 등 전략적 프레임워크 활용 가능
                - 마크다운을 사용하여 분석 내용을 구조화
                - 전략적 인사이트와 실행 가능한 제안 제시
                - 답변 ${maxTextLength}자 이내 작성`;
            break;
          case "historian":
            systemPrompt = `
              역할: 역사 전문가
              조건:
                - 역사적 패턴과 과거 사례를 기반으로 주제 분석
                - 유사한 역사적 상황과 비교하여 교훈 도출
                - 시간적 맥락에서 주제의 발전 과정 분석
                - 마크다운을 사용하여 분석 내용을 구조화
                - 역사적 근거와 예시 중심의 분석 제공
                - 답변 ${maxTextLength}자 이내 작성`;
            break;
          case "critic":
            systemPrompt = `
              역할: 비평가
              조건:
                - 비판적 관점에서 주제의 장단점 분석
                - 다양한 대안과 관점 제시
                - 주류 의견에 대한 비판적 검토
                - 마크다운을 사용하여 분석 내용을 구조화
                - 건설적인 비판과 대안 제시
                - 답변 ${maxTextLength}자 이내 작성`;
            break;
          default:
            // 기본 전문가 역할
            systemPrompt = `
              역할: 주제 전문가
              조건:
                - 주제에 대한 깊이 있는 전문 지식 기반 분석 제공
                - 객관적 근거와 논리적 추론 중심
                - 다양한 관점과 가능성 고려
                - 마크다운을 사용하여 분석 내용을 구조화
                - 답변 ${maxTextLength}자 이내 작성`;
        }
      } else {
        // 최종 결론 도출용 프롬프트
        systemPrompt = `
          역할: 종합 분석가
          조건:
            - 다양한 전문가 의견을 객관적으로 종합하여 결론 도출
            - 상충되는 의견 간의 균형 있는 통합
            - 핵심 통찰과 주요 발견 요약
            - 명확한 구조로 결론 제시 (요약, 주요 발견, 결론, 권장사항 등)
            - 마크다운을 사용하여 결론을 구조화
            - 답변 ${maxTextLength * 1.5}자 이내 작성`;
      }
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokensPerModel,
      temperature: mode === "Debate" ? 0.7 : 0.5, // 결론 모드는 더 낮은 온도로 일관성 확보
    });

    // undefined 및 null 검사 강화
    const messageContent = response.choices[0]?.message?.content;

    if (!messageContent) {
      return NextResponse.json(
        { error: "AI에서 응답을 받지 못했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      result: messageContent,
    });
  } catch (error: unknown) {
    // 에러 타입 처리
    const err = error as Error & ApiError;

    console.error("[GPT API ERROR]", err);

    let errorMessage = "GPT 처리 중 오류 발생";
    if (err.message) {
      errorMessage += `: ${err.message}`;
    }

    // OpenAI API 오류 구체적 처리
    const status = err.status || 500;
    if (status === 429) {
      errorMessage = "API 사용량 한도 초과. 잠시 후 다시 시도해주세요.";
    }

    return NextResponse.json({ error: errorMessage }, { status });
  }
}

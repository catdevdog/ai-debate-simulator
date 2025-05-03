// api/ai.ts

// 지원하는 요청 모드 타입
export type RequestMode = "Debate" | "Conclusion";

export async function AI(
  model: string,
  prompt: string,
  mode: RequestMode = "Debate",
  role?: string
): Promise<string> {
  // 타임아웃 설정 (20초)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    // Conclusion 모드일 때 추가 옵션 설정
    const additionalOptions =
      mode === "Conclusion"
        ? {
            temperature: 0.5,
            top_p: 0.9,
            max_tokens: 2000,
            presence_penalty: -0.5, // 중복 회피를 줄임
            frequency_penalty: -0.3, // 자연스러운 반복 허용
          }
        : {};

    const response = await fetch(`/api/${model}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, mode, role, ...additionalOptions }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API 오류: ${response.status}`);
    }

    const data = await response.json();

    // 결과가 없는 경우 처리
    if (!data.result || data.result.trim() === "") {
      console.warn(`[${model}] 빈 응답 반환됨`);
      return `[${model}에서 응답이 없습니다. 다시 시도해 주세요.]`;
    }

    return data.result;
  } catch (error: unknown) {
    console.error(`[${model} API 호출 오류]:`, error);

    // 에러 객체 처리
    const err = error as Error;

    // AbortController에 의한 타임아웃인 경우
    if (err.name === "AbortError") {
      return `[${model} 응답 시간이 초과되었습니다. 다시 시도해 주세요.]`;
    }

    return `[${model} 오류: ${err.message || "알 수 없는 오류"}]`;
  } finally {
    clearTimeout(timeoutId);
  }
}

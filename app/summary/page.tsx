"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDebateStore } from "@/lib/store/useDebateStore";
import styles from "./page.module.scss";
import MarkdownRenderer from "@/components/MarkdownRenderer";

export default function Summary() {
  const router = useRouter();
  const { subject, debateRecord, isDebateFinished } = useDebateStore();
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 토론이 종료되지 않았다면 처리 페이지로 리디렉션
    if (!isDebateFinished || debateRecord.length === 0) {
      alert("먼저 토론을 완료해주세요.");
      router.push("/process");
      return;
    }

    generateSummary();
  }, [isDebateFinished, debateRecord, router]);

  const generateSummary = async () => {
    try {
      setIsLoading(true);

      // 토론 내용 준비
      const debateContent = debateRecord
        .map(
          (record) =>
            `${record.model} (${
              record.side === "Affirmative" ? "찬성" : "반대"
            }): ${record.content}`
        )
        .join("\n\n");

      // 요약 생성을 위한 프롬프트
      const prompt = `
주제: ${subject}

토론 내용:
${debateContent}

위 토론 내용을 객관적으로 요약하고 다음 형식으로 분석해주세요:

1. **주요 논점 요약**: 토론에서 다루어진 주요 논점들
2. **찬성 측 주요 주장**: 찬성 측이 제시한 주요 주장과 근거
3. **반대 측 주요 주장**: 반대 측이 제시한 주요 주장과 근거
4. **결론**: 토론의 전체적인 흐름과 결론

마크다운 형식으로 작성해주세요.
`;

      // 기본적으로 GPT-4o 또는 Claude 중 하나를 사용
      // 실제 구현에서는 useModels에서 가장 고급 모델을 선택하거나 미리 정의된 모델을 사용할 수 있음
      const apiEndpoint = "/api/gpt-4o"; // 또는 claude-3-7-sonnet-latest

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("요약 생성 중 오류가 발생했습니다");
      }

      interface ApiResponse {
        result?: string;
        error?: string;
      }

      const data: ApiResponse = await response.json();
      setSummary(data.result || "요약을 생성할 수 없습니다.");
    } catch (error: unknown) {
      console.error("요약 생성 오류:", error);
      setError("요약을 생성하는 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    generateSummary();
  };

  return (
    <div className={styles.container}>
      <div className={styles.summaryContainer}>
        <header className={styles.header}>
          <h1>토론 요약</h1>
          <h2>주제: {subject}</h2>
        </header>

        <div className={styles.actions}>
          <button
            className={styles.button}
            onClick={() => router.push("/process")}
          >
            토론으로 돌아가기
          </button>
          <button className={styles.button} onClick={() => router.push("/")}>
            새 토론 시작하기
          </button>
        </div>

        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <p>요약을 생성하는 중입니다...</p>
          </div>
        ) : error ? (
          <div className={styles.error}>
            <p>{error}</p>
            <button onClick={handleRetry} className={styles.retryButton}>
              다시 시도
            </button>
          </div>
        ) : (
          <div className={styles.summaryContent}>
            <MarkdownRenderer>{summary}</MarkdownRenderer>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { AI } from "@/api/ai";
import { useDebateStore } from "@/lib/store/useDebateStore";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./page.module.scss";
import MarkdownRenderer from "../../components/MarkdownRenderer";
import TypingEffect from "../../components/TypingEffect";

export default function Process() {
  // 스토어에서 상태 가져오기
  const {
    subject,
    debateSetting,
    useModels,
    debateRecord,
    currentModel,
    isLoading,
    isDebateFinished,

    // 액션
    setPrompt,
    setCurrentModel,
    setIsLoading,
    setError,
    addDebateRecord,
    setIsDebateFinished,
  } = useDebateStore();

  // 토론 자동 진행 상태 관리
  const autoProgressRef = useRef(false);
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRY = 2;

  // 타이핑 효과 상태
  const [showTypingEffect, setShowTypingEffect] = useState(true);
  const [typingSpeed, setTypingSpeed] = useState(20); // 타이핑 속도 (밀리초)

  useEffect(() => {
    if (subject === "") {
      alert("주제를 설정해주세요.");
      router.push("/");
    }
  }, [router, subject]);

  // 초기화 이펙트
  useEffect(() => {
    setCurrentModel(debateSetting.startModel);
  }, [debateSetting.startModel, setCurrentModel]);

  // 자동 진행 이펙트
  useEffect(() => {
    const shouldContinueDebate =
      autoProgressRef.current &&
      !isLoading &&
      !isDebateFinished &&
      debateRecord.length > 0;

    if (!shouldContinueDebate) return;

    const totalTurns = useModels.length * debateSetting.answerLimit;

    if (debateRecord.length < totalTurns) {
      const timer = setTimeout(handleAIResponse, 1000);
      return () => clearTimeout(timer);
    } else {
      finishDebate();
    }
  }, [
    isLoading,
    debateRecord.length,
    isDebateFinished,
    useModels.length,
    debateSetting.answerLimit,
  ]);

  // 에러 메시지 표시 타이머
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // 토론 종료 처리
  const finishDebate = () => {
    autoProgressRef.current = false;
    setIsDebateFinished(true);
    console.log("토론 종료");
  };

  // 프롬프트 생성
  const createPrompt = () => {
    // 주제 설정
    let result = `주제: ${subject}`;

    // 현재 모델의 입장 찾기
    const currentModelSide = useModels.find(
      (model) => model.name === currentModel
    )?.side;

    // 이전 대화 기록 추가
    if (debateRecord.length > 0) {
      const conversationHistory = debateRecord
        .map((record) => `${record.model} (${record.side}): ${record.content}`)
        .join("\n\n");

      result += `\n\n${conversationHistory}`;
    }

    // 지시사항 추가
    result += `\n\n당신은 ${currentModel}입니다. 
      위 대화를 바탕으로 ${currentModelSide}의 입장에서, 상대의 주장을 반박하거나 자신의 주장을 강화하는 답변을 작성하세요.
      필요에 따라 마크다운 문법을 활용하여 응답을 구조화해도 좋습니다.`;

    return result;
  };

  // AI 응답 처리
  const handleAIResponse = async () => {
    // 현재 모델의 입장 확인
    const side =
      useModels.find((m) => m.name === currentModel)?.side ?? "Affirmative";

    // 프롬프트 생성 및 설정
    const newPrompt = createPrompt();
    setPrompt(newPrompt);

    try {
      setIsLoading(true);
      setRetryCount(0); // 재시도 카운트 초기화

      // AI 응답 가져오기 - 모드 명시적으로 전달
      const response = await AI(currentModel, newPrompt, "Debate");

      // 오류 응답 확인
      if (response.startsWith("[") && response.includes("오류")) {
        throw new Error(response);
      }

      // 대화 기록 추가
      addDebateRecord({
        model: currentModel,
        side,
        content: response,
      });

      // 다음 모델로 전환
      switchToNextModel();

      // 토론 종료 확인
      checkDebateCompletion();
    } catch (err) {
      await handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 다음 모델로 전환
  const switchToNextModel = () => {
    const currentIndex = useModels.findIndex((m) => m.name === currentModel);
    const nextIndex = (currentIndex + 1) % useModels.length;
    const nextModel = useModels[nextIndex].name;
    setCurrentModel(nextModel);
  };

  // 토론 완료 확인
  const checkDebateCompletion = () => {
    const totalTurns = useModels.length * debateSetting.answerLimit;
    if (debateRecord.length + 1 >= totalTurns) {
      console.log("토론 종료됨!");
      finishDebate();
    }
  };

  // 오류 처리
  const handleError = async (err: unknown) => {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("AI 응답 오류:", errorMsg);

    // 전역 오류 상태 설정
    setError(errorMsg);
    setErrorMessage(errorMsg);

    // 자동 재시도 로직 (최대 2번)
    if (retryCount < MAX_RETRY && autoProgressRef.current) {
      setRetryCount((prevCount) => prevCount + 1);
      setErrorMessage(`응답 오류, ${MAX_RETRY - retryCount}회 재시도 중...`);

      // 1.5초 후 재시도
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return handleAIResponse();
    }

    // 최대 재시도 횟수 초과 시 자동 진행 중지
    if (retryCount >= MAX_RETRY) {
      autoProgressRef.current = false;
    }
  };

  // 자동 토론 제어 함수들
  const startAutoDebate = () => {
    if (!isDebateFinished && !isLoading) {
      autoProgressRef.current = true;
      handleAIResponse();
    }
  };

  const stopAutoDebate = () => {
    autoProgressRef.current = false;
  };

  // 첫 번째 모델 확인 (메시지 정렬용)
  const getFirstModelName = () => {
    return useModels.length > 0 ? useModels[0].name : "";
  };

  // 수동 재시도 함수
  const retryResponse = () => {
    if (!isLoading) {
      handleAIResponse();
    }
  };

  // 타이핑 효과 토글
  const toggleTypingEffect = () => {
    setShowTypingEffect(!showTypingEffect);
  };

  // 타이핑 속도 조절
  const changeTypingSpeed = (speed: "slow" | "medium" | "fast") => {
    switch (speed) {
      case "slow":
        setTypingSpeed(40);
        break;
      case "medium":
        setTypingSpeed(20);
        break;
      case "fast":
        setTypingSpeed(5);
        break;
    }
  };

  // 렌더링
  return (
    <div className={styles.container}>
      <div className={styles.debateContainer}>
        {/* 헤더 섹션 */}
        <div className={styles.debateHeader}>
          <h1>AI 토론 시뮬레이터</h1>
          <h2>주제: {subject}</h2>
          <div className={styles.controls}>
            <button
              onClick={handleAIResponse}
              disabled={isLoading || isDebateFinished}
              className={styles.button}
            >
              {isLoading ? "AI 응답 중..." : "다음 턴 진행"}
            </button>
            <button
              onClick={startAutoDebate}
              className={styles.button}
              disabled={
                isLoading || isDebateFinished || autoProgressRef.current
              }
            >
              자동 진행 시작
            </button>
            <button
              onClick={stopAutoDebate}
              className={styles.button}
              disabled={!autoProgressRef.current}
            >
              자동 진행 중지
            </button>
            <button onClick={toggleTypingEffect} className={styles.button}>
              {showTypingEffect ? "타이핑 효과 끄기" : "타이핑 효과 켜기"}
            </button>
            <button
              onClick={() => router.push("/")}
              className={styles.buttonSecondary}
            >
              처음으로
            </button>
          </div>

          {showTypingEffect && (
            <div className={styles.speedControls}>
              <span>타이핑 속도:</span>
              <button
                onClick={() => changeTypingSpeed("slow")}
                className={`${styles.speedButton} ${
                  typingSpeed === 40 ? styles.activeSpeed : ""
                }`}
              >
                느리게
              </button>
              <button
                onClick={() => changeTypingSpeed("medium")}
                className={`${styles.speedButton} ${
                  typingSpeed === 20 ? styles.activeSpeed : ""
                }`}
              >
                보통
              </button>
              <button
                onClick={() => changeTypingSpeed("fast")}
                className={`${styles.speedButton} ${
                  typingSpeed === 5 ? styles.activeSpeed : ""
                }`}
              >
                빠르게
              </button>
            </div>
          )}

          {/* 에러 메시지 표시 */}
          {errorMessage && (
            <div className={styles.errorMessage}>
              <span>{errorMessage}</span>
              <button onClick={retryResponse} disabled={isLoading}>
                재시도
              </button>
            </div>
          )}
        </div>

        {/* 채팅 컨테이너 */}
        <div className={styles.chatContainer}>
          {/* 대화 기록 메시지 */}
          {debateRecord.map((record, index) => (
            <div
              key={index}
              className={`${styles.message} ${
                record.model === getFirstModelName()
                  ? styles.left
                  : styles.right
              }`}
            >
              <div className={styles.messageContent}>
                <div className={styles.messageSender}>
                  {record.model} (
                  {record.side === "Affirmative" ? "동의" : "반대"})
                </div>
                <div className={styles.messageText}>
                  {showTypingEffect && index === debateRecord.length - 1 ? (
                    <TypingEffect
                      text={record.content}
                      speed={typingSpeed}
                      delay={300}
                    />
                  ) : (
                    <MarkdownRenderer>{record.content}</MarkdownRenderer>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* 로딩 메시지 */}
          {isLoading && (
            <div
              className={`${styles.message} ${styles.loading} ${
                currentModel === getFirstModelName()
                  ? styles.left
                  : styles.right
              }`}
            >
              <div className={styles.messageContent}>
                <div className={styles.messageSender}>
                  {currentModel} 생각 중...
                </div>
                <div className={styles.messageText}>
                  <div className={styles.loadingAnimation}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 토론 종료 메시지 */}
          {isDebateFinished && (
            <div className={styles.debateFinished}>
              토론이 종료되었습니다
              <button
                onClick={() => router.push("/summary")}
                className={styles.summaryButton}
              >
                토론 요약 보기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

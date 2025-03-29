"use client";

import { AI } from "@/api/ai";
import { useDebateStore } from "@/lib/store/useDebateStore";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import styles from "./page.module.scss";

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

  useEffect(() => {
    if (subject === "") {
      alert("주제를 설정해주세요.");
      router.push("/");
    }
  }, []);

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
  }, [isLoading, debateRecord.length, isDebateFinished]);

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
        .join("\n");

      result += `\n\n${conversationHistory}`;
    }

    // 지시사항 추가
    result += `\n\n당신은 ${currentModel}입니다. 
      위 대화를 바탕으로 ${currentModelSide}의 입장에서, 상대의 주장을 반박하거나 자신의 주장을 강화하는 답변을 작성하세요.`;

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

      // AI 응답 가져오기
      // const modelKey = getModelKey(currentModel);
      const response = await AI(currentModel, newPrompt);

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
      handleError(err);
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
  const handleError = (err: unknown) => {
    setError("AI 응답 실패");
    console.error(err);
    autoProgressRef.current = false; // 오류 발생 시 자동 진행 중지
  };

  // 모델 키 가져오기
  // const getModelKey = (fullName: string): TypeModel => {
  //   if (fullName.toLowerCase().includes("gpt")) return "gpt";
  //   if (fullName.toLowerCase().includes("claude")) return "claude";
  //   throw new Error("지원되지 않는 모델입니다.");
  // };

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

  // 렌더링
  return (
    <div className={styles.container}>
      <div className={styles.debateContainer}>
        {/* 헤더 섹션 */}
        <div className={styles.debateHeader}>
          <h1>토론 진행</h1>
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
          </div>
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
                <div className={styles.messageText}>{record.content}</div>
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
                  응답을 생성 중입니다...
                </div>
              </div>
            </div>
          )}

          {/* 토론 종료 메시지 */}
          {isDebateFinished && (
            <div className={styles.debateFinished}>토론이 종료되었습니다</div>
          )}
        </div>
      </div>
    </div>
  );
}

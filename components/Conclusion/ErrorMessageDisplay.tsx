// src/components/Conclusion/ErrorMessageDisplay.tsx
import React from "react";
// CSS 모듈 경로 주의!
import styles from "../../app/conclusion-process/page.module.scss";

interface Props {
  errorMessage: string | null;
  isLoading: boolean; // 재시도 버튼 활성화 제어용
  onRetry: () => void; // 재시도 핸들러 (useConclusionProcess의 continueConversation 사용)
}

const ErrorMessageDisplay: React.FC<Props> = ({
  errorMessage,
  isLoading,
  onRetry,
}) => {
  if (!errorMessage) return null;

  // '재시도 중...' 메시지인지 확인
  const isRetryingMessage = errorMessage.includes("재시도합니다...");

  return (
    <div className={styles.errorMessage}>
      <span>{errorMessage}</span>
      {/* '재시도 중...' 메시지가 아닐 때만 재시도 버튼 표시 */}
      {!isRetryingMessage && (
        <button onClick={onRetry} disabled={isLoading}>
          수동 재시도
        </button>
      )}
    </div>
  );
};

export default ErrorMessageDisplay;

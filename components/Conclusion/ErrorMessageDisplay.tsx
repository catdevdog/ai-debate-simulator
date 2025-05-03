import React from "react";
import styles from "../../app/conclusion-process/page.module.scss";

interface Props {
  errorMessage: string | null;
  isLoading: boolean;
  onRetry: () => void;
}

const ErrorMessageDisplay: React.FC<Props> = ({
  errorMessage,
  isLoading,
  onRetry,
}) => {
  if (!errorMessage) return null;

  const isRetryingMessage = errorMessage.includes("재시도합니다...");

  return (
    <div className={styles.errorCard}>
      <div className={styles.errorIcon}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 22H22L12 2ZM12 18C11.45 18 11 17.55 11 17C11 16.45 11.45 16 12 16C12.55 16 13 16.45 13 17C13 17.55 12.55 18 12 18ZM13 14H11V10H13V14Z" />
        </svg>
      </div>
      <div className={styles.errorContent}>
        <p className={styles.errorText}>{errorMessage}</p>
        {!isRetryingMessage && (
          <button
            onClick={onRetry}
            disabled={isLoading}
            className={styles.retryButton}
          >
            다시 시도
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessageDisplay;

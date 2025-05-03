import React from "react";
import { useRouter } from "next/navigation";
import styles from "../../app/conclusion-process/page.module.scss";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface Props {
  conclusion: string;
  model: string;
}

const FinalConclusionDisplay: React.FC<Props> = ({ conclusion, model }) => {
  const router = useRouter();

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(conclusion)
      .then(() => {
        // 복사 완료 알림을 위한 토스트 메시지 추가 예정
        console.log("복사 완료");
      })
      .catch((err) => {
        console.error("클립보드 복사 실패:", err);
        alert("클립보드 복사에 실패했습니다.");
      });
  };

  return (
    <article className={styles.finalConclusionCard}>
      <header className={styles.finalConclusionHeader}>
        <div className={styles.conclusionTitle}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 2L4 14L6 16L11 11V24H21V11L26 16L28 14L16 2Z" />
            <rect x="6" y="26" width="20" height="2" />
          </svg>
          <h3>최종 분석 결론</h3>
        </div>
        <div className={styles.modelInfo}>
          <span className={styles.modelBadge}>분석 모델: {model}</span>
        </div>
      </header>

      <main className={styles.finalConclusionContent}>
        <MarkdownRenderer>{conclusion}</MarkdownRenderer>
      </main>

      <footer className={styles.finalConclusionActions}>
        <button onClick={() => router.push("/")} className={styles.homeButton}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1L1 7H3V14H13V7H15L8 1Z" />
          </svg>
          처음으로 돌아가기
        </button>
        <button onClick={copyToClipboard} className={styles.copyButton}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 2H10V4H4V14H12V10H14V14C14 14.55 13.55 15 13 15H3C2.45 15 2 14.55 2 14V3C2 2.45 2.45 2 3 2H4ZM15 1V6H13V3H10V1H15ZM11 5H13V7L15 5L13 3V5Z" />
          </svg>
          결론 복사하기
        </button>
      </footer>
    </article>
  );
};

export default FinalConclusionDisplay;

// src/components/Conclusion/FinalConclusionDisplay.tsx
import React from "react";
import { useRouter } from "next/navigation";
// CSS 모듈 경로 주의!
import styles from "../../app/conclusion-process/page.module.scss";
// MarkdownRenderer 경로 확인 필요
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface Props {
  conclusion: string; // 최종 결론 내용
  model: string; // 최종 결론을 도출한 모델 이름
}

const FinalConclusionDisplay: React.FC<Props> = ({ conclusion, model }) => {
  const router = useRouter();

  // 클립보드 복사 핸들러
  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(conclusion)
      .then(() => alert("결론이 클립보드에 복사되었습니다."))
      .catch((err) => {
        console.error("클립보드 복사 실패:", err);
        alert("클립보드 복사에 실패했습니다.");
      });
  };

  return (
    <div className={styles.finalConclusionCard}>
      <div className={styles.finalConclusionHeader}>
        <h3>최종 결론</h3>
        {/* 결론 도출 모델 배지 */}
        <span className={styles.modelBadge}>{model}</span>
      </div>
      {/* 결론 내용 (Markdown 렌더링) */}
      <div className={styles.finalConclusionContent}>
        <MarkdownRenderer>{conclusion}</MarkdownRenderer>
      </div>
      {/* 액션 버튼들 */}
      <div className={styles.actionButtons}>
        <button onClick={() => router.push("/")} className={styles.homeButton}>
          처음으로 돌아가기
        </button>
        <button onClick={copyToClipboard} className={styles.copyButton}>
          결론 복사하기
        </button>
      </div>
    </div>
  );
};

export default FinalConclusionDisplay;

// src/components/Conclusion/FinalConclusionLoading.tsx
import React from "react";
// CSS 모듈 경로 주의!
import styles from "../../app/conclusion-process/page.module.scss";

interface Props {
  finalModelName: string; // 최종 결론을 생성하는 모델 이름
}

const FinalConclusionLoading: React.FC<Props> = ({ finalModelName }) => {
  return (
    <div className={styles.finalConclusionLoading}>
      <div className={styles.loadingAnimation}>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <h3>최종 결론 도출 중...</h3>
      <p>
        {finalModelName} 모델이 모든 대화를 종합하여 결론을 생성하고 있습니다.
      </p>
    </div>
  );
};

export default FinalConclusionLoading;

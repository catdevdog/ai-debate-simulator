import React from "react";
import styles from "../../app/conclusion-process/page.module.scss";

interface Props {
  finalModelName: string;
}

const FinalConclusionLoading: React.FC<Props> = ({ finalModelName }) => {
  return (
    <div className={styles.finalConclusionLoading}>
      <div className={styles.loadingHeader}>
        <h3 className={styles.loadingTitle}>최종 결론 분석 중</h3>
        <div className={styles.loadingAnimation}>
          <div className={styles.spinner} />
        </div>
      </div>

      <div className={styles.loadingBody}>
        <p className={styles.loadingDescription}>
          {finalModelName} 모델이 모든 전문가의 의견을 종합하여 최종 결론을
          도출하고 있습니다.
        </p>

        <div className={styles.loadingProgress}>
          <div className={styles.progressDots}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalConclusionLoading;

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDebateStore } from "@/lib/store/useDebateStore";
import styles from "./page.module.scss";

// 모델 역할 정의
interface ModelRole {
  id: string;
  name: string;
  description: string;
}

// 사전 정의된 역할들
const predefinedRoles: ModelRole[] = [
  {
    id: "analyst",
    name: "데이터 분석가",
    description: "정량적 데이터를 분석하고 객관적인 통계 기반 정보 제공",
  },
  {
    id: "economist",
    name: "경제 전문가",
    description: "경제 이론과 시장 역학 관점에서 분석",
  },
  {
    id: "strategist",
    name: "전략가",
    description: "장기적 관점에서 전략적 함의 분석",
  },
  {
    id: "historian",
    name: "역사 전문가",
    description: "과거 사례와 역사적 패턴 기반 분석",
  },
  {
    id: "critic",
    name: "비평가",
    description: "비판적 관점에서 분석하고 대안 제시",
  },
];

export default function ConclusionSetup() {
  const router = useRouter();
  const { usableModels, setConclusionSetting, setMode, settingReset } =
    useDebateStore();

  // 로컬 상태
  const [subject, setSubject] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [finalModel, setFinalModel] = useState<string>("");
  const [requireEvidence, setRequireEvidence] = useState<boolean>(true);
  const [customRoles, setCustomRoles] = useState<Record<string, string>>({});

  // 컴포넌트 마운트 시 상태 초기화
  useEffect(() => {
    settingReset();
    setMode("Conclusion");

    // 기본값으로 모든 모델 선택
    if (usableModels.length > 0 && selectedModels.length === 0) {
      setSelectedModels([...usableModels]);
      setFinalModel(usableModels[0]);
    }
  }, [usableModels, settingReset, setMode, selectedModels.length]);

  // 모델 선택 토글
  const toggleModel = (model: string) => {
    if (selectedModels.includes(model)) {
      // 선택 해제 시 최종 결론 모델에서도 제거
      const newSelected = selectedModels.filter((m) => m !== model);
      setSelectedModels(newSelected);

      if (finalModel === model && newSelected.length > 0) {
        setFinalModel(newSelected[0]);
      }
    } else {
      setSelectedModels([...selectedModels, model]);
    }
  };

  // 역할 설정 업데이트
  const updateModelRole = (model: string, role: string) => {
    setCustomRoles({
      ...customRoles,
      [model]: role,
    });
  };

  // 결론 도출 프로세스 시작
  const startConclusionProcess = () => {
    if (!subject) {
      alert("주제를 입력해주세요.");
      return;
    }

    if (selectedModels.length < 2) {
      alert("최소 2개 이상의 모델을 선택해주세요.");
      return;
    }

    if (!finalModel) {
      alert("최종 결론을 도출할 모델을 선택해주세요.");
      return;
    }

    // 스토어에 설정 저장
    setConclusionSetting(subject, selectedModels, finalModel, requireEvidence);

    // 결론 도출 프로세스 페이지로 이동
    router.push("/conclusion-process");
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>결론 도출 모드 설정</h1>

      <div className={styles.formSection}>
        <label className={styles.label}>
          분석 주제 또는 질문:
          <textarea
            className={styles.subjectInput}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="예: 현 트럼프 정책에 가장 안전한 ETF는 무엇인가?"
            rows={3}
          />
        </label>
      </div>

      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>참여 모델 선택</h2>
        <p className={styles.sectionDescription}>
          각 모델은 서로 다른 관점에서 주제를 분석하고 최종적으로 결론을
          도출합니다.
        </p>

        <div className={styles.modelsGrid}>
          {usableModels.map((model) => (
            <div key={model} className={styles.modelCard}>
              <div className={styles.modelHeader}>
                <input
                  type="checkbox"
                  id={`model-${model}`}
                  checked={selectedModels.includes(model)}
                  onChange={() => toggleModel(model)}
                />
                <label htmlFor={`model-${model}`}>{model}</label>
              </div>

              {selectedModels.includes(model) && (
                <div className={styles.modelRole}>
                  <label>모델 역할:</label>
                  <select
                    value={customRoles[model] || ""}
                    onChange={(e) => updateModelRole(model, e.target.value)}
                  >
                    <option value="">역할 선택...</option>
                    {predefinedRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.formSection}>
        <h2 className={styles.sectionTitle}>최종 결론 도출 모델</h2>
        <p className={styles.sectionDescription}>
          다른 모델들의 분석을 종합하여 최종 결론을 제시할 모델을 선택하세요.
        </p>

        <div className={styles.finalModelSelection}>
          {selectedModels.map((model) => (
            <div key={model} className={styles.finalModelOption}>
              <input
                type="radio"
                id={`final-${model}`}
                name="finalModel"
                value={model}
                checked={finalModel === model}
                onChange={() => setFinalModel(model)}
              />
              <label htmlFor={`final-${model}`}>{model}</label>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.formSection}>
        <div className={styles.optionCheckbox}>
          <input
            type="checkbox"
            id="require-evidence"
            checked={requireEvidence}
            onChange={(e) => setRequireEvidence(e.target.checked)}
          />
          <label htmlFor="require-evidence">
            결론에 증거/근거 요구 (각 모델이 자신의 주장에 객관적 근거와 출처
            제시)
          </label>
        </div>
      </div>

      <div className={styles.actionButtons}>
        <button className={styles.backButton} onClick={() => router.push("/")}>
          처음으로 돌아가기
        </button>
        <button className={styles.startButton} onClick={startConclusionProcess}>
          결론 도출 시작
        </button>
      </div>
    </div>
  );
}

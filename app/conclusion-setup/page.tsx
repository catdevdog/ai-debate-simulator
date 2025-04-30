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
    id: "expert",
    name: "전문가",
    description: "주제에 대한 다양한 관점에서 전문적인 분석 제공",
  },
  {
    id: "fact_checker",
    name: "팩트체커",
    description: "주장에 대한 사실 확인 및 검증",
  },
  {
    id: "philosopher",
    name: "철학자",
    description: "윤리적, 철학적 관점에서 분석",
  },
  {
    id: "scientist",
    name: "과학자",
    description: "과학적 방법론과 데이터 기반 분석",
  },
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
  {
    id: "tech_expert",
    name: "기술 전문가",
    description: "기술 동향 및 혁신 관점에서 분석",
  },
  {
    id: "legal_expert",
    name: "법률 전문가",
    description: "법적 측면과 규제 관점에서 분석",
  },
  {
    id: "ethical_expert",
    name: "윤리 전문가",
    description: "윤리적 관점과 사회적 영향력 측면에서 분석",
  },
  {
    id: "psychology_expert",
    name: "심리학 전문가",
    description: "인간 행동 및 심리학적 관점에서 분석",
  },
  {
    id: "environmental_expert",
    name: "환경 전문가",
    description: "환경적 영향과 지속가능성 관점에서 분석",
  },
  {
    id: "medical_expert",
    name: "의료 전문가",
    description: "의학적 관점과 건강 관련 정보 제공",
  },
  {
    id: "custom_expert",
    name: "커스텀",
    description: "전문가 프롬프트 설정",
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
  const [modelRoles, setModelRoles] = useState<Record<string, string>>({});
  const [customRoleDescription, setCustomRoleDescription] = useState<
    Record<string, string>
  >({});

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

      // 모델 역할 정보 삭제
      const newModelRoles = { ...modelRoles };
      delete newModelRoles[model];
      setModelRoles(newModelRoles);

      // 맞춤형 전문가 설명 삭제
      const newCustomRoleDesc = { ...customRoleDescription };
      delete newCustomRoleDesc[model];
      setCustomRoleDescription(newCustomRoleDesc);

      if (finalModel === model && newSelected.length > 0) {
        setFinalModel(newSelected[0]);
      }
    } else {
      setSelectedModels([...selectedModels, model]);

      // 기본 역할 할당 (첫 번째 역할로)
      setModelRoles({
        ...modelRoles,
        [model]: predefinedRoles[0].id,
      });
    }
  };

  // 역할 설정 업데이트
  const updateModelRole = (model: string, role: string) => {
    setModelRoles({
      ...modelRoles,
      [model]: role,
    });
  };

  // 맞춤형 전문가 설명 업데이트
  const updateCustomRoleDescription = (model: string, description: string) => {
    setCustomRoleDescription({
      ...customRoleDescription,
      [model]: description,
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

    // 모든 모델에 역할이 지정되었는지 확인
    const allModelsHaveRoles = selectedModels.every(
      (model) => modelRoles[model]
    );
    if (!allModelsHaveRoles) {
      alert("모든 모델에 역할을 지정해주세요.");
      return;
    }

    // 맞춤형 전문가를 사용하는 모델 중 설명이 없는 경우 확인
    const customRolesNeedingDescription = selectedModels.filter(
      (model) =>
        modelRoles[model] === "custom_expert" &&
        (!customRoleDescription[model] ||
          customRoleDescription[model].trim() === "")
    );

    if (customRolesNeedingDescription.length > 0) {
      alert("맞춤형 전문가를 선택한 모델의 전문 분야를 입력해주세요.");
      return;
    }

    // 스토어에 설정 저장
    setConclusionSetting(
      subject,
      selectedModels,
      finalModel,
      requireEvidence,
      modelRoles,
      customRoleDescription
    );

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
            placeholder="예: 'AI기술의 미래는 어떻게 될까?'"
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
                  {/* 기본값 expert */}
                  <select
                    value={modelRoles[model] || ""}
                    onChange={(e) => updateModelRole(model, e.target.value)}
                  >
                    <option value="">역할 선택...</option>
                    {predefinedRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} - {role.description}
                      </option>
                    ))}
                  </select>

                  {/* 맞춤형 전문가 선택 시 추가 입력 필드 표시 */}
                  {modelRoles[model] === "custom_expert" && (
                    <div className={styles.customRoleInput}>
                      <label>전문 분야 설명:</label>
                      <textarea
                        placeholder="예: 금융 투자 전문가, 부동산 시장 전문가, 헬스케어 전문가 등"
                        value={customRoleDescription[model] || ""}
                        onChange={(e) =>
                          updateCustomRoleDescription(model, e.target.value)
                        }
                        rows={2}
                      />
                    </div>
                  )}
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

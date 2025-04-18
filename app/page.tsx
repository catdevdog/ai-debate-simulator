"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.scss";
import { useDebateStore, TypeSide } from "@/lib/store/useDebateStore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const storeSetting = useDebateStore((s) => s.setInitialSetting);
  const reset = useDebateStore((s) => s.settingReset);
  const usableModels = useDebateStore((s) => s.usableModels);
  const defaultUseModels = useDebateStore((s) => s.useModels);
  const setMode = useDebateStore((s) => s.setMode);

  const [settingForm, setSettingForm] = useState({
    subject: "",
    prompt: "",
    debateSetting: {
      startModel: "gpt-4o",
      answerLimit: 3,
    },
    useModels: [] as typeof defaultUseModels,
  });

  // 초기 useModels 설정 (default)
  useEffect(() => {
    reset();
    setSettingForm((prev) => ({
      ...prev,
      useModels: defaultUseModels,
    }));
  }, [reset, defaultUseModels]);

  // 모델 선택/해제 토글
  const toggleModel = (model: string) => {
    setSettingForm((prev) => {
      const exists = prev.useModels.find((exModel) => exModel.name === model);
      const newModels = exists
        ? prev.useModels.filter((exModel) => exModel.name !== model)
        : [...prev.useModels, { name: model, side: "Affirmative" as TypeSide }];

      return {
        ...prev,
        useModels: newModels,
      };
    });
  };

  // 역할 변경 (찬/반)
  const changeSide = (model: string, side: TypeSide) => {
    setSettingForm((prev) => ({
      ...prev,
      useModels: prev.useModels.map((exModel) =>
        exModel.name === model
          ? {
              name: exModel.name,
              side: side,
            }
          : exModel
      ),
    }));
  };

  const onClickStart = () => {
    setMode("Debate"); // 토론 모드 설정
    storeSetting(
      settingForm.subject,
      settingForm.prompt,
      settingForm.debateSetting,
      settingForm.useModels
    );
    router.push("/process");
  };

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <h1 className={styles.title}>AI 토론 & 분석 시뮬레이터</h1>

        <div className={styles.modeSelection}>
          <div className={styles.modeOption}>
            <h2>토론 모드</h2>
            <p>여러 AI 모델이 찬반 입장을 나누어 주제에 대해 토론합니다.</p>
            <div className={styles.modeContent}>
              <textarea
                className={styles.request}
                value={settingForm.subject}
                onChange={(e) =>
                  setSettingForm({ ...settingForm, subject: e.target.value })
                }
                placeholder="찬반 토론 주제를 입력해주세요."
              />
              <button className={styles.button} onClick={onClickStart}>
                토론 시작
              </button>
            </div>

            <div className={styles.setting}>
              <div>
                <span>시작 모델 선택 : </span>
                <select
                  value={settingForm.debateSetting.startModel}
                  onChange={(e) =>
                    setSettingForm({
                      ...settingForm,
                      debateSetting: {
                        ...settingForm.debateSetting,
                        startModel: e.target.value,
                      },
                    })
                  }
                >
                  {settingForm.useModels.map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span>각 모델 답변 횟수 제한 :</span>
                <input
                  type="number"
                  value={settingForm.debateSetting.answerLimit}
                  placeholder="2 ~ 5"
                  min={2}
                  max={5}
                  onChange={(e) =>
                    setSettingForm({
                      ...settingForm,
                      debateSetting: {
                        ...settingForm.debateSetting,
                        answerLimit: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>

              <div>
                <span>토론 참여 모델 선택, 역할 부여</span>
                <div className={styles.model_select}>
                  {usableModels.map((model) => {
                    const selected = settingForm.useModels.find(
                      (m) => m.name === model
                    );

                    return (
                      <div key={model} className={styles.model}>
                        <input
                          type="checkbox"
                          id={model}
                          checked={!!selected}
                          onChange={() => toggleModel(model)}
                        />
                        <label htmlFor={model}>{model}</label>

                        {selected && (
                          <>
                            <input
                              type="radio"
                              name={`side-${model}`}
                              id={`side-${model}-Affirmative`}
                              checked={selected.side === "Affirmative"}
                              onChange={() => changeSide(model, "Affirmative")}
                            />
                            <label htmlFor={`side-${model}-Affirmative`}>
                              찬성
                            </label>

                            <input
                              type="radio"
                              name={`side-${model}`}
                              id={`side-${model}-Negative`}
                              checked={selected.side === "Negative"}
                              onChange={() => changeSide(model, "Negative")}
                            />
                            <label htmlFor={`side-${model}-Negative`}>
                              반대
                            </label>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.modeOption}>
            <h2>결론 도출 모드</h2>
            <p>
              여러 AI 모델이 다양한 관점에서 주제를 분석하고 최종 결론을
              도출합니다.
            </p>
            <div className={styles.modeContent}>
              <Link
                href="/conclusion-setup"
                className={styles.conclusionButton}
              >
                결론 도출 모드 설정하기
              </Link>
              <p className={styles.exampleText}>
                예: &quot;현 트럼프 정책에 가장 안전한 ETF는 무엇인가?&quot;
              </p>
            </div>
            <div className={styles.benefits}>
              <div className={styles.benefit}>
                <strong>다양한 관점</strong>
                <span>각 AI 모델이 다른 전문가 역할을 수행합니다.</span>
              </div>
              <div className={styles.benefit}>
                <strong>종합 결론</strong>
                <span>모든 분석을 종합하여 최종 결론을 제시합니다.</span>
              </div>
              <div className={styles.benefit}>
                <strong>근거 기반</strong>
                <span>객관적인 데이터와 분석을 통한 결론 도출</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

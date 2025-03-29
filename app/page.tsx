"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.scss";
import { useDebateStore, TypeSide } from "@/lib/store/useDebateStore";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const storeSetting = useDebateStore((s) => s.setInitialSetting);
  const usableModels = useDebateStore((s) => s.usableModels);
  const defaultUseModels = useDebateStore((s) => s.useModels);

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
    setSettingForm((prev) => ({
      ...prev,
      useModels: defaultUseModels,
    }));
  }, []);

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
        <textarea
          className={styles.request}
          onChange={(e) =>
            setSettingForm({ ...settingForm, subject: e.target.value })
          }
          placeholder="찬반 토론 주제를 입력해주세요."
        />
        <button className={styles.button} onClick={onClickStart}>
          토론 시작
        </button>

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
              <option value="gpt-4o">GPT-4o</option>
              <option value="claude-3.7 Sonnet">Claude 3.7 Sonnet</option>
            </select>
          </div>

          <div>
            <span>각 모델 답변 제한 : </span>
            <input
              type="number"
              value={settingForm.debateSetting.answerLimit}
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
                        <label htmlFor={`side-${model}-Negative`}>반대</label>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

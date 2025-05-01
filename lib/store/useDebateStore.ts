import { create } from "zustand";

// 타입 분리 및 export
export type TypeSide = "Affirmative" | "Negative";
export type TypeMode = "Debate" | "Conclusion";

// 개별 항목 타입을 명확히 export
export interface ConclusionRecordItem {
  model: string;
  role: string;
  perspective: string;
  content: string;
  stage?: number;
}

export interface DebateRecordItem {
  model: string;
  side: TypeSide;
  content: string;
}

export interface UseModelItem {
  name: string;
  side: TypeSide;
}

export interface DebateSetting {
  startModel: string;
  answerLimit: number;
}

export interface ConclusionSetting {
  models: string[];
  finalModel: string;
  requireEvidence: boolean;
  modelRoles: Record<string, string>;
  customRoleDescriptions: Record<string, string>;
}

// 메인 상태 인터페이스는 분리된 타입을 참조
interface TypeDebateState {
  maxTokensPerModel: number;
  maxTextLength: number;
  usableModels: string[];
  mode: TypeMode;
  subject: string;
  prompt: string; // 사용 용도 확인 필요 (ConclusionProcess에서는 직접 사용 안 함)
  debateSetting: DebateSetting; // 타입 참조
  conclusionSetting: ConclusionSetting; // 타입 참조
  useModels: UseModelItem[]; // 타입 참조 (Debate 모드용)
  debateRecord: DebateRecordItem[]; // 타입 참조
  conclusionRecord: ConclusionRecordItem[]; // 타입 참조
  currentModel: string;
  nextModel: string; // 사용 용도 확인 필요 (ConclusionProcess에서는 직접 사용 안 함)
  isLoading: boolean;
  error: string;
  isDebateFinished: boolean;
  isConclusionFinished: boolean;
  finalConclusion: string;
  result: string; // 사용 용도 확인 필요 (Debate 모드 결과?)

  // 액션 정의 (동일)
  addDebateRecord: (record: DebateRecordItem) => void;
  addConclusionRecord: (record: ConclusionRecordItem) => void;
  setMode: (mode: TypeMode) => void;
  setInitialSetting: (
    // Debate 모드 초기 설정용
    subject: string,
    prompt: string,
    debateSetting: DebateSetting,
    useModels: UseModelItem[]
  ) => void;
  setConclusionSetting: (
    // Conclusion 모드 초기 설정용
    subject: string,
    models: string[],
    finalModel: string,
    requireEvidence: boolean,
    modelRoles?: Record<string, string>,
    customRoleDescriptions?: Record<string, string>
  ) => void;
  setPrompt: (prompt: string) => void;
  setCurrentModel: (model: string) => void;
  setNextModel: (model: string) => void;
  setResult: (result: string) => void;
  setFinalConclusion: (conclusion: string) => void;
  setError: (error: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsDebateFinished: (isFinished: boolean) => void;
  setIsConclusionFinished: (isFinished: boolean) => void;
  settingReset: () => void;
}

// create 함수는 동일
export const useDebateStore = create<TypeDebateState>((set) => ({
  // get 추가 (reset 등에서 초기값 필요 시 사용)
  maxTokensPerModel: 1000,
  maxTextLength: 100,
  usableModels: [
    "gpt-4o",
    "claude-3-5-haiku-latest",
    "claude-3-7-sonnet-latest",
  ],
  mode: "Debate", // 기본 모드
  subject: "",
  prompt: "",
  debateSetting: {
    startModel: "",
    answerLimit: 3,
  },
  conclusionSetting: {
    models: [],
    finalModel: "",
    requireEvidence: true,
    modelRoles: {},
    customRoleDescriptions: {},
  },
  useModels: [
    // 기본값 예시
    { name: "gpt-4o", side: "Affirmative" },
    { name: "claude-3-5-haiku-latest", side: "Negative" },
  ],
  isLoading: false,
  debateRecord: [],
  conclusionRecord: [],
  currentModel: "",
  nextModel: "",
  error: "",
  result: "",
  finalConclusion: "",
  isDebateFinished: false,
  isConclusionFinished: false,

  // 액션 구현 (동일 - 타입만 참조하도록 변경됨)
  addDebateRecord: (record) =>
    set((state) => ({ debateRecord: [...state.debateRecord, record] })),
  addConclusionRecord: (record) =>
    set((state) => ({ conclusionRecord: [...state.conclusionRecord, record] })),
  setMode: (mode) => set({ mode }), // 간결하게 표현 가능
  setInitialSetting: (subject, prompt, debateSetting, useModels) =>
    set({
      subject,
      prompt,
      debateSetting,
      useModels,
      // 초기화 시 관련 상태 초기화
      debateRecord: [],
      conclusionRecord: [],
      currentModel: debateSetting.startModel, // 시작 모델 설정
      nextModel: "", // 필요 시 설정
      error: "",
      result: "",
      finalConclusion: "",
      isDebateFinished: false,
      isConclusionFinished: false,
      isLoading: false,
      mode: "Debate", // 모드 명시
    }),
  setConclusionSetting: (
    subject,
    models,
    finalModel,
    requireEvidence,
    modelRoles = {},
    customRoleDescriptions = {}
  ) =>
    set({
      subject,
      conclusionSetting: {
        models,
        finalModel,
        requireEvidence,
        modelRoles: modelRoles || {},
        customRoleDescriptions: customRoleDescriptions || {},
      },
      // 초기화 시 관련 상태 초기화
      debateRecord: [],
      conclusionRecord: [],
      currentModel: models.length > 0 ? models[0] : "", // 첫 번째 모델을 현재 모델로
      nextModel: "",
      error: "",
      result: "",
      finalConclusion: "",
      isDebateFinished: false,
      isConclusionFinished: false,
      isLoading: false,
      mode: "Conclusion", // 모드 명시
    }),
  setPrompt: (prompt) => set({ prompt }),
  setCurrentModel: (model) => set({ currentModel: model }),
  setNextModel: (model) => set({ nextModel: model }),
  setResult: (result) => set({ result }),
  setFinalConclusion: (conclusion) => set({ finalConclusion: conclusion }),
  setError: (error) => set({ error }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsDebateFinished: (isFinished) => set({ isDebateFinished: isFinished }),
  setIsConclusionFinished: (isFinished) =>
    set({ isConclusionFinished: isFinished }),
  settingReset: () =>
    set({
      // get() 사용 불필요 시 제거 가능, 기본값 직접 명시
      subject: "",
      prompt: "",
      debateSetting: { startModel: "", answerLimit: 3 },
      conclusionSetting: {
        models: [],
        finalModel: "",
        requireEvidence: true,
        modelRoles: {},
        customRoleDescriptions: {},
      },
      // useModels는 보통 유지하거나 초기 설정값으로 돌림
      // useModels: get().useModels, // 이전 상태 유지 시
      // useModels: [ { name: "gpt-4o", side: "Affirmative" }, ... ], // 기본값으로 리셋 시
      debateRecord: [],
      conclusionRecord: [],
      currentModel: "",
      nextModel: "",
      error: "",
      result: "",
      finalConclusion: "",
      isDebateFinished: false,
      isConclusionFinished: false,
      isLoading: false,
    }),
}));

// --- 다른 파일에서의 import 예시 ---
// import { useDebateStore, type ConclusionSetting, type ConclusionRecordItem } from '@/lib/store/useDebateStore';

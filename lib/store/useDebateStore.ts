import { create } from "zustand";

export type TypeSide = "Affirmative" | "Negative"; // 찬성, 반대
export type TypeMode = "Debate" | "Conclusion"; // 토론 또는 결론 도출 모드

interface TypeDebateState {
  maxTokensPerModel: number; // 각 모델 최대 토큰 수
  maxTextLength: number; // 각 모델 최대 텍스트 길이

  usableModels: string[]; // 사용 가능한 모델

  // 모드 선택
  mode: TypeMode;

  // 토론 세팅
  subject: string; // 주제
  prompt: string; // 전달 할 프롬프트 (이전 대화내용을 포함해야함)
  debateSetting: {
    startModel: string; // 시작 모델
    answerLimit: number; // 각 모델 답변 제한 (= debate round)
  };

  // 결론 모드 세팅
  conclusionSetting: {
    models: string[]; // 참여 모델 리스트
    finalModel: string; // 최종 결론을 내릴 모델
    requireEvidence: boolean; // 증거/근거 필요 여부
  };

  // 사용 모델 선택
  useModels: {
    // 모델
    name: string;
    side: TypeSide;
  }[];

  // 토론 기록
  debateRecord: {
    // 모델 대화 목록
    model: string;
    side: TypeSide;
    content: string;
  }[];

  // 결론 도출 기록
  conclusionRecord: {
    model: string;
    role: string; // 모델의 역할 (예: "분석가", "경제 전문가" 등)
    perspective: string; // 분석 관점
    content: string;
  }[];

  addDebateRecord: (record: {
    model: string;
    side: TypeSide;
    content: string;
  }) => void;

  addConclusionRecord: (record: {
    model: string;
    role: string;
    perspective: string;
    content: string;
  }) => void;

  currentModel: string;
  nextModel: string;

  isLoading: boolean;

  error: string;

  isDebateFinished: boolean;
  isConclusionFinished: boolean;

  finalConclusion: string;
  result: string;

  setMode: (mode: TypeMode) => void;
  setInitialSetting: (
    subject: string,
    prompt: string,
    debateSetting: {
      startModel: string;
      answerLimit: number;
    },
    useModels: { name: string; side: TypeSide }[]
  ) => void;

  setConclusionSetting: (
    subject: string,
    models: string[],
    finalModel: string,
    requireEvidence: boolean
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

export const useDebateStore = create<TypeDebateState>((set) => ({
  // api단에 어떻게 전달?
  maxTokensPerModel: 1000, // 각 모델 최대 토큰 수
  maxTextLength: 100, // 각 모델 최대 텍스트 길이

  usableModels: [
    "gpt-4o",
    "claude-3-5-haiku-latest",
    "claude-3-7-sonnet-latest",
  ], // 사용 가능한 모델

  mode: "Debate", // 기본 모드는 토론

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
  },

  useModels: [
    { name: "gpt-4o", side: "Affirmative" },
    { name: "claude-3-5-haiku-latest", side: "Negative" },
  ], // 사용 모델 선택

  isLoading: false,

  debateRecord: [],
  addDebateRecord: (record) =>
    set((state) => ({
      ...state,
      debateRecord: [...state.debateRecord, record],
    })),

  conclusionRecord: [],
  addConclusionRecord: (record) =>
    set((state) => ({
      ...state,
      conclusionRecord: [...state.conclusionRecord, record],
    })),

  currentModel: "",
  nextModel: "",
  error: "",
  result: "",
  finalConclusion: "",
  isDebateFinished: false,
  isConclusionFinished: false,

  setMode: (mode) => set((state) => ({ ...state, mode })),

  setInitialSetting: (subject, prompt, debateSetting, useModels) => {
    set((state) => ({
      ...state,
      subject,
      prompt,
      debateSetting,
      useModels,
    }));
  },

  setConclusionSetting: (subject, models, finalModel, requireEvidence) => {
    set((state) => ({
      ...state,
      subject,
      conclusionSetting: {
        models,
        finalModel,
        requireEvidence,
      },
    }));
  },

  setPrompt: (prompt) => set((state) => ({ ...state, prompt })),

  setCurrentModel: (model) =>
    set((state) => ({ ...state, currentModel: model })),
  setNextModel: (model) => set((state) => ({ ...state, nextModel: model })),
  setResult: (result) => set((state) => ({ ...state, result })),
  setFinalConclusion: (conclusion) =>
    set((state) => ({ ...state, finalConclusion: conclusion })),
  setError: (error) => set((state) => ({ ...state, error })),
  setIsLoading: (isLoading) => set((state) => ({ ...state, isLoading })),
  setIsDebateFinished: (isFinished) =>
    set((state) => ({ ...state, isDebateFinished: isFinished })),
  setIsConclusionFinished: (isFinished) =>
    set((state) => ({ ...state, isConclusionFinished: isFinished })),

  settingReset: () =>
    set((state) => ({
      ...state,
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
      },
      useModels: state.useModels,
      debateRecord: [],
      conclusionRecord: [],
      currentModel: "",
      nextModel: "",
      error: "",
      result: "",
      finalConclusion: "",
      isLoading: false,
      isDebateFinished: false,
      isConclusionFinished: false,
      usableModels: state.usableModels,
    })),
}));

import { create } from "zustand";

export type TypeSide = "Affirmative" | "Negative"; // 찬성, 반대

interface TypeDebateState {
  maxTokensPerModel: number; // 각 모델 최대 토큰 수
  maxTextLength: number; // 각 모델 최대 텍스트 길이

  usableModels: string[]; // 사용 가능한 모델

  // 토론 세팅
  subject: string; // 주제
  prompt: string; // 전달 할 프롬프트 (이전 대화내용을 포함해야함)
  debateSetting: {
    startModel: string; // 시작 모델
    answerLimit: number; // 각 모델 답변 제한 (= debate round)
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

  addDebateRecord: (record: {
    model: string;
    side: TypeSide;
    content: string;
  }) => void;

  currentModel: string;
  nextModel: string;

  isLoading: boolean;

  error: string;

  isDebateFinished: boolean;
  result: string;

  setInitialSetting: (
    subject: string,
    prompt: string,
    debateSetting: {
      startModel: string;
      answerLimit: number;
    },
    useModels: { name: string; side: TypeSide }[]
  ) => void;

  setPrompt: (prompt: string) => void;

  setCurrentModel: (model: string) => void;
  setNextModel: (model: string) => void;
  setResult: (result: string) => void;
  setError: (error: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsDebateFinished: (isFinished: boolean) => void;

  settingReset: () => void;
}

export const useDebateStore = create<TypeDebateState>((set) => ({
  maxTokensPerModel: 1000, // 각 모델 최대 토큰 수
  maxTextLength: 100, // 각 모델 최대 텍스트 길이
  usableModels: ["gpt-4o", "claude-3.5 haiku"], // 사용 가능한 모델

  subject: "",
  prompt: "",
  debateSetting: {
    startModel: "",
    answerLimit: 3,
  },
  useModels: [
    { name: "gpt-4o", side: "Affirmative" },
    { name: "claude-3.5 haiku", side: "Negative" },
  ], // 사용 모델 선택
  isLoading: false,
  debateRecord: [],
  addDebateRecord: (record) =>
    set((state) => ({
      ...state,
      debateRecord: [...state.debateRecord, record],
    })),
  currentModel: "",
  nextModel: "",
  error: "",
  result: "",
  isDebateFinished: false,

  setInitialSetting: (subject, prompt, debateSetting, useModels) => {
    set((state) => ({
      ...state,
      subject,
      prompt,
      debateSetting,
      useModels,
    }));
  },

  setPrompt: (prompt) => set((state) => ({ ...state, prompt })),

  setCurrentModel: (model) =>
    set((state) => ({ ...state, currentModel: model })),
  setNextModel: (model) => set((state) => ({ ...state, nextModel: model })),
  setResult: (result) => set((state) => ({ ...state, result })),
  setError: (error) => set((state) => ({ ...state, error })),
  setIsLoading: (isLoading) => set((state) => ({ ...state, isLoading })),
  setIsDebateFinished: (isFinished) =>
    set((state) => ({ ...state, isDebateFinished: isFinished })),

  settingReset: () =>
    set((state) => ({
      ...state,
      subject: "",
      prompt: "",
      debateSetting: {
        startModel: "",
        answerLimit: 3,
      },
      useModels: [
        { name: "gpt-4o", side: "Affirmative" },
        { name: "claude-3.5 haiku", side: "Negative" },
      ],
      debateRecord: [],
      currentModel: "",
      nextModel: "",
      error: "",
      result: "",
      isLoading: false,
      isDebateFinished: false,
      // 초기화 시 사용 가능한 모델로 설정
      usableModels: ["gpt-4o", "claude-3.5 haiku"],
    })),
}));

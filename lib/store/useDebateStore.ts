import { create } from "zustand";

export type TypeSide = "Affirmative" | "Negative"; // 찬성, 반대

interface TypeDebateState {
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

  currentModel: string;
  nextModel: string;

  isLoading: boolean;

  error: string;

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

  setResult: (result: string) => void;
  setError: (error: string) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useDebateStore = create<TypeDebateState>((set) => ({
  usableModels: ["gpt-4o", "claude-3.7 Sonnet"],

  subject: "",
  prompt: "",
  debateSetting: {
    startModel: "",
    answerLimit: 3,
  },
  useModels: [
    { name: "gpt-4o", side: "Affirmative" },
    { name: "claude-3.7 Sonnet", side: "Negative" },
  ], // 사용 모델 선택
  isLoading: false,
  debateRecord: [],
  currentModel: "",
  nextModel: "",
  error: "",
  result: "",

  setInitialSetting: (subject, prompt, debateSetting, useModels) => {
    set((state) => ({
      ...state,
      subject,
      prompt,
      debateSetting,
      useModels,
    }));
  },

  setResult: (result) => set((state) => ({ ...state, result })),
  setError: (error) => set((state) => ({ ...state, error })),
  setIsLoading: (isLoading) => set((state) => ({ ...state, isLoading })),
}));

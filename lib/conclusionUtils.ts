// src/lib/conclusionUtils.ts (또는 lib/conclusionUtils.ts)

// 스토어 타입 가져오기 - 실제 경로에 맞게 수정하세요.
import type {
  ConclusionSetting,
  ConclusionRecordItem,
} from "@/lib/store/useDebateStore";

export const MAX_RETRY = 2;
export const MAX_CONVERSATION_STAGES = 3;

// 전문가 역할에 따른 시스템 프롬프트 정의
export const expertisePrompts: Record<string, string> = {
  expert:
    "당신은 주어진 주제에 대한 전문가입니다. 다양한 관점에서 전문적인 분석을 간결하게 제공하세요.",
  fact_checker:
    "당신은 팩트체커입니다. 주장에 대한 사실 확인 및 검증을 통해 객관적인 의견을 간결하게 제시하세요.",
  philosopher:
    "당신은 철학자입니다. 윤리적, 철학적 관점에서 주제를 분석하고 간결하게 의견을 제시하세요.",
  scientist:
    "당신은 과학자입니다. 과학적 방법론과 데이터 기반으로 주제를 분석하고 간결하게 의견을 제시하세요.",
  analyst:
    "당신은 데이터 분석가입니다. 정량적 데이터를 기반으로 객관적인 통계 기반 정보를 간결하게 제공하세요.",
  economist:
    "당신은 경제 전문가입니다. 경제 이론과 시장 역학 관점에서 주제를 분석하고 간결하게 의견을 제시하세요.",
  strategist:
    "당신은 전략가입니다. 장기적 관점에서 주제의 전략적 함의를 분석하고 간결하게 의견을 제시하세요.",
  historian:
    "당신은 역사 전문가입니다. 역사적 패턴과 과거 사례를 기반으로 주제를 분석하고 간결하게 의견을 제시하세요.",
  critic:
    "당신은 비평가입니다. 비판적 관점에서 주제를 분석하고 대안을 간결하게 제시하세요.",
  tech_expert:
    "당신은 기술 전문가입니다. 기술 동향 및 혁신 관점에서 주제를 분석하고 간결하게 의견을 제시하세요.",
  legal_expert:
    "당신은 법률 전문가입니다. 법적 측면과 규제 관점에서 주제를 분석하고 간결하게 의견을 제시하세요.",
  ethical_expert:
    "당신은 윤리 전문가입니다. 윤리적 관점과 사회적 영향력 측면에서 주제를 분석하고 간결하게 의견을 제시하세요.",
  psychology_expert:
    "당신은 심리학 전문가입니다. 인간 행동 및 심리학적 관점에서 주제를 분석하고 간결하게 의견을 제시하세요.",
  environmental_expert:
    "당신은 환경 전문가입니다. 환경적 영향과 지속가능성 관점에서 주제를 분석하고 간결하게 의견을 제시하세요.",
  medical_expert:
    "당신은 의료 전문가입니다. 의학적 관점과 건강 관련 정보를 바탕으로 주제를 분석하고 간결하게 의견을 제시하세요.",
};

// 역할 ID에 따른 한글 이름
export const roleNames: Record<string, string> = {
  expert: "전문가",
  fact_checker: "팩트체커",
  philosopher: "철학자",
  scientist: "과학자",
  analyst: "데이터 분석가",
  economist: "경제 전문가",
  strategist: "전략가",
  historian: "역사 전문가",
  critic: "비평가",
  tech_expert: "기술 전문가",
  legal_expert: "법률 전문가",
  ethical_expert: "윤리 전문가",
  psychology_expert: "심리학 전문가",
  environmental_expert: "환경 전문가",
  medical_expert: "의료 전문가",
  custom_expert: "맞춤형 전문가",
};

// 전문가 역할 프롬프트 생성
export const getExpertPrompt = (
  model: string,
  conclusionSetting: ConclusionSetting
): string => {
  const roleId = conclusionSetting.modelRoles[model] || "expert";

  if (roleId === "custom_expert") {
    const customDescription =
      conclusionSetting.customRoleDescriptions[model] || "";
    return `당신은 ${customDescription} 전문가입니다. 전문 분야의 관점에서 주제를 분석하고 간결하게 의견을 제시하세요.`;
  }
  return expertisePrompts[roleId] || expertisePrompts.expert;
};

// 역할 이름 가져오기
export const getRoleName = (
  model: string,
  conclusionSetting: ConclusionSetting
): string => {
  const roleId = conclusionSetting.modelRoles[model] || "expert";

  if (roleId === "custom_expert") {
    const customDescription =
      conclusionSetting.customRoleDescriptions[model] || "";
    return customDescription ? `${customDescription} 전문가` : "맞춤형 전문가";
  }
  return roleNames[roleId] || "전문가";
};

// 대화 단계별 프롬프트 생성
export const createConversationPrompt = (
  stage: number,
  subject: string,
  currentModel: string,
  conclusionSetting: ConclusionSetting,
  conclusionRecord: ConclusionRecordItem[],
  discussionTopic: string
): string => {
  const expertPrompt = getExpertPrompt(currentModel, conclusionSetting);
  const roleName = getRoleName(currentModel, conclusionSetting);

  const previousMessages = conclusionRecord
    .map((record) => `${record.model} (${record.role}): ${record.content}`)
    .join("\n\n");

  let stageInstruction = "";
  if (stage === 0) {
    stageInstruction = `주제에 대한 초기 의견을 3문장 이내로 제시하세요. 다른 전문가들이 논의할 수 있는 핵심적인 관점을 짧게 제시하는 것이 중요합니다.\n\n현재 논의 주제: ${discussionTopic}`;
  } else if (stage === MAX_CONVERSATION_STAGES - 1) {
    stageInstruction = `지금까지의 논의를 바탕으로 가장 합리적인 결론 방향을 3문장 이내로 제안하세요. 다른 전문가들의 의견 중 동의하는 부분을 언급하고 최종 결론을 위한 방향을 제시하세요.`;
  } else {
    stageInstruction = `이전 의견들에 대한 당신의 반응을 3문장 이내로 제시하세요. 동의하는 부분과 추가하고 싶은 관점을 간결하게 언급하세요.`;
  }

  let prompt = `주제: ${subject}\n\n${expertPrompt}\n\n`;
  if (previousMessages) {
    prompt += `이전 대화 내용:\n\n${previousMessages}\n\n`;
  }
  prompt += `당신은 ${currentModel} 모델로, ${roleName}의 관점에서 대화에 참여하고 있습니다.\n\n${stageInstruction}\n\n반드시 3문장 이내의 간결한 답변으로 작성하세요. 장황한 설명이나 불필요한 인사말은 생략하고 핵심만 말하세요.`;

  return prompt;
};

// 최종 결론 프롬프트 생성
export const createFinalConclusionPrompt = (
  subject: string,
  conclusionSetting: ConclusionSetting,
  conclusionRecord: ConclusionRecordItem[]
): string => {
  const discussionContent = conclusionRecord
    .map((record) => `${record.model} (${record.role}): ${record.content}`)
    .join("\n\n");

  let prompt = `주제: ${subject}\n\n지금까지의 전문가 토론 내용:\n\n${discussionContent}\n\n`;
  prompt += `당신은 ${conclusionSetting.finalModel} 모델입니다. 위의 다양한 전문가들이 나눈 대화를 바탕으로 최종 결론을 도출해주세요.\n\n`;
  prompt += `결론에는 다음 사항을 명확히 포함해주세요:\n1. 토론에서 나온 주요 관점들의 간략한 요약\n2. 가장 설득력 있는 주장과 그 이유\n3. 최종 결론 - 명확하게 "결론적으로, ~이다"라는 형식으로 제시\n`;
  if (conclusionSetting.requireEvidence) {
    prompt += `4. 이 결론을 지지하는 핵심 근거\n`;
  }
  prompt += `\n결론은 객관적이고 명확해야 하며, 가장 타당한 하나의 결론을 도출해주세요. 여러 가능성을 나열하는 방식은 피해주세요.`;

  return prompt;
};

// 진행 상태 문구
export const getStageDescription = (stage: number): string => {
  if (stage === 0) return "초기 의견 제시";
  if (stage === MAX_CONVERSATION_STAGES - 1) return "합의점 찾기";
  if (stage >= MAX_CONVERSATION_STAGES) return "최종 결론 도출";
  return `논의 단계 ${stage}`;
};

// conclusionUtils 객체로 묶어서 export (선택 사항, 사용 시 import 방식 변경 필요)
export const conclusionUtils = {
  MAX_RETRY,
  MAX_CONVERSATION_STAGES,
  expertisePrompts,
  roleNames,
  getExpertPrompt,
  getRoleName,
  createConversationPrompt,
  createFinalConclusionPrompt,
  getStageDescription,
};

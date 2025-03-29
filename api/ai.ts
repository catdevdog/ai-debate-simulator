export type TypeModel = "gpt" | "claude";

export async function AI(model: TypeModel, prompt: string): Promise<string> {
  try {
    const response = await fetch(`/api/${model}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    }).then((res) => res.json());

    return response.result ?? `[${model} 응답 없음]`;
  } catch (error) {
    console.error(`Error calling ${model} API:`, error);
    return `[${model} 오류 발생]`;
  }
}

type TypeResult = {
  result_gpt: string;
  result_claude: string;
};

export async function AI(prompt: string): Promise<TypeResult> {
  const [gptRes, claudeRes] = await Promise.all([
    fetch("/api/gpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    }).then((res) => res.json()),

    fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    }).then((res) => res.json()),
  ]);

  return {
    result_gpt: gptRes.result ?? "[GPT 응답 없음]",
    result_claude: claudeRes.result ?? "[Claude 응답 없음]",
  };
}

"use client";

import { useEffect } from "react";
import { useDebateStore } from "@/lib/store/useDebateStore";

export default function Process() {
  const subject = useDebateStore((s) => s.subject);
  const prompt = useDebateStore((s) => s.prompt);
  const debateSetting = useDebateStore((s) => s.debateSetting);
  const useModels = useDebateStore((s) => s.useModels);

  useEffect(() => {
    console.log("주제: ", subject);
    console.log("프롬프트: ", prompt);
    console.log("debateSetting", debateSetting);
    console.log("useModels", useModels);
  }, []);

  return (
    <div>
      <h1>Process</h1>
    </div>
  );
}

"use client";

// import Image from "next/image";
import { useState } from "react";
import styles from "./page.module.css";
import { AI } from "@/api/ai";

type TypeAnswer = {
  result_gpt: string | null | undefined;
  result_claude: string | null | undefined;
};

export default function Home() {
  const [text, setText] = useState("");

  const [answer, setAnswer] = useState<TypeAnswer>();

  const getResponse = async () => {
    const response = await AI(text);
    setAnswer(response);
  };

  return (
    <div className={styles.page}>
      <h1>Hello World!</h1>
      <input type="text" onChange={(e) => setText(e.target.value)} />
      <button onClick={getResponse}>질문</button>

      {answer && (
        <div>
          <h2>OpenAI</h2>
          <p>{answer.result_gpt}</p>
          <h2>Anthropic</h2>
          <p>{answer.result_claude}</p>
        </div>
      )}
    </div>
  );
}

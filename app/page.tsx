"use client";

// import Image from "next/image";
import { useState } from "react";
import styles from "./page.module.scss";
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
      <div className={styles.wrap}>
        <textarea
          className={styles.request}
          onChange={(e) => setText(e.target.value)}
        />
        <button className={styles.button} onClick={getResponse}>
          토론 시작
        </button>

        {answer && (
          <div>
            <h2>OpenAI</h2>
            <p>{answer.result_gpt}</p>
            <h2>Anthropic</h2>
            <p>{answer.result_claude}</p>
          </div>
        )}
      </div>
    </div>
  );
}

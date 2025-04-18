"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./TypingEffect.module.scss";

interface TypingEffectProps {
  text: string;
  speed?: number; // 타이핑 속도 (밀리초)
  delay?: number; // 시작 전 지연 시간 (밀리초)
  className?: string;
  onComplete?: () => void;
}

const TypingEffect: React.FC<TypingEffectProps> = ({
  text,
  speed = 30,
  delay = 200,
  className = "",
  onComplete,
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  useEffect(() => {
    if (currentIndex === 0) {
      // 처음 시작 시 지연
      const initialTimer = setTimeout(() => {
        if (text.length > 0) {
          setCurrentIndex(1);
          setDisplayedText(text.slice(0, 1));
        } else {
          setIsComplete(true);
          onComplete?.();
        }
      }, delay);

      return () => clearTimeout(initialTimer);
    }

    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setDisplayedText(text.slice(0, currentIndex + 1));
      }, speed);

      return () => clearTimeout(timer);
    } else if (!isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, text, speed, delay, isComplete, onComplete]);

  // 마크다운 텍스트를 지원하기 위해 HTML로 렌더링
  const renderText = () => {
    return {
      __html: displayedText.replace(/\n/g, "<br />"),
    };
  };

  return (
    <div
      className={`${styles.typingEffect} ${className} ${
        isComplete ? styles.completed : ""
      }`}
      ref={containerRef}
    >
      <div dangerouslySetInnerHTML={renderText()} />
      {!isComplete && <span className={styles.cursor}>|</span>}
    </div>
  );
};

export default TypingEffect;

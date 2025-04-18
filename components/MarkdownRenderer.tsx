// components/MarkdownRenderer.tsx
"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./MarkdownRenderer.module.scss";

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

export default function MarkdownRenderer({
  children,
  className = "",
}: MarkdownRendererProps) {
  return (
    <div className={`${styles.markdown} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 헤딩 스타일링
          h1: (props) => <h1 className={styles.heading1}>{props.children}</h1>,
          h2: (props) => <h2 className={styles.heading2}>{props.children}</h2>,
          h3: (props) => <h3 className={styles.heading3}>{props.children}</h3>,

          // 인라인 코드 스타일링
          code: (props) => {
            const { className, children, inline, ...rest } = props as {
              className?: string;
              children: React.ReactNode;
              inline?: boolean;
              [key: string]: unknown;
            };

            if (inline) {
              return (
                <code className={styles.inlineCode} {...rest}>
                  {children}
                </code>
              );
            }

            return (
              <code
                className={`${styles.codeBlock} ${className || ""}`}
                {...rest}
              >
                {children}
              </code>
            );
          },

          // 리스트 스타일링
          ul: (props) => <ul className={styles.list}>{props.children}</ul>,
          ol: (props) => (
            <ol className={styles.orderedList}>{props.children}</ol>
          ),
          li: (props) => <li className={styles.listItem}>{props.children}</li>,

          // 강조 스타일링
          em: (props) => <em className={styles.italic}>{props.children}</em>,
          strong: (props) => (
            <strong className={styles.bold}>{props.children}</strong>
          ),

          // 링크 스타일링
          a: (props) => (
            <a
              className={styles.link}
              href={props.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {props.children}
            </a>
          ),

          // 인용구 스타일링
          blockquote: (props) => (
            <blockquote className={styles.blockquote}>
              {props.children}
            </blockquote>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

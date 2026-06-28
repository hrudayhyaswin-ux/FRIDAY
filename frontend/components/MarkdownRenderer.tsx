"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface MarkdownRendererProps {
  content: str;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // Split content by triple backticks to separate text and code blocks
  const parts = content.split(/```/);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-zinc-100">
      {parts.map((part, index) => {
        const isCodeBlock = index % 2 === 1;

        if (isCodeBlock) {
          // Extract language name if present
          const firstLineBreak = part.indexOf("\n");
          let language = "code";
          let code = part;

          if (firstLineBreak !== -1) {
            const possibleLang = part.substring(0, firstLineBreak).trim();
            if (possibleLang && possibleLang.length < 15) {
              language = possibleLang;
              code = part.substring(firstLineBreak + 1);
            }
          }

          return <CodeBlock key={index} language={language} code={code.trim()} />;
        } else {
          return <TextBlock key={index} text={part} />;
        }
      })}
    </div>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-cyan-500/20 bg-zinc-950/80 shadow-lg shadow-cyan-950/10">
      <div className="flex items-center justify-between border-b border-cyan-500/10 bg-zinc-900/60 px-4 py-2 text-xs font-mono text-cyan-400">
        <span>{language.toUpperCase()}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs font-mono text-zinc-300 leading-normal scrollbar-thin scrollbar-thumb-zinc-800">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function TextBlock({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        // Skip empty lines at the very beginning or end
        if (line.trim() === "" && (i === 0 || i === lines.length - 1)) return null;

        // Headers
        if (line.startsWith("# ")) {
          return (
            <h1 key={i} className="text-xl font-bold text-cyan-400 mt-4 mb-2 tracking-wide font-sans">
              {parseInlineMarkdown(line.substring(2))}
            </h1>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="text-lg font-semibold text-purple-400 mt-4 mb-2 tracking-wide font-sans">
              {parseInlineMarkdown(line.substring(3))}
            </h2>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} className="text-base font-semibold text-zinc-200 mt-3 mb-1 font-sans">
              {parseInlineMarkdown(line.substring(4))}
            </h3>
          );
        }

        // Bullet Lists
        if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
          const content = line.trim().substring(2);
          return (
            <ul key={i} className="list-disc pl-5 my-1 text-zinc-300">
              <li>{parseInlineMarkdown(content)}</li>
            </ul>
          );
        }

        // Numbered Lists
        const numberedMatch = line.trim().match(/^(\d+)\.\s(.*)/);
        if (numberedMatch) {
          const num = numberedMatch[1];
          const content = numberedMatch[2];
          return (
            <ol key={i} className="list-decimal pl-5 my-1 text-zinc-300">
              <li value={parseInt(num)}>{parseInlineMarkdown(content)}</li>
            </ol>
          );
        }

        // Horizontal Line
        if (line.trim() === "---") {
          return <hr key={i} className="my-4 border-zinc-800" />;
        }

        // Standard Paragraph
        return (
          <p key={i} className="text-zinc-300 min-h-[1rem]">
            {parseInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Basic helper to parse bold (**text**), italic (*text*), and inline code (`code`)
 */
function parseInlineMarkdown(text: string) {
  // Regex to match inline code, bold, etc.
  // We'll split the text and render React elements.
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={index} className="italic text-zinc-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="rounded bg-zinc-900 border border-zinc-800 px-1 py-0.5 font-mono text-xs text-pink-400">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

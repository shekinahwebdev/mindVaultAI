"use client";

import { Fragment } from "react";

import {
  parseAssistantAnswerBlocks,
  stripAssistantMarkdown,
} from "@/lib/chat/format-assistant-answer";

type ChatAssistantAnswerProps = {
  text: string;
};

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

export function ChatAssistantAnswer({ text }: ChatAssistantAnswerProps) {
  const blocks = parseAssistantAnswerBlocks(text);

  if (blocks.length === 0) {
    return (
      <p className="text-[0.9rem] leading-relaxed text-foreground whitespace-pre-wrap">
        {stripAssistantMarkdown(text)}
      </p>
    );
  }

  return (
    <div className="space-y-3 text-[0.9rem] leading-relaxed text-foreground">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return <p key={index}>{renderInline(block.text)}</p>;
        }
        if (block.type === "ordered-list") {
          return (
            <ol key={index} className="list-decimal space-y-2 pl-5 marker:text-muted-foreground">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="pl-1">
                  {renderInline(item)}
                </li>
              ))}
            </ol>
          );
        }
        return (
          <ul key={index} className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="pl-1 text-muted-foreground">
                {renderInline(item)}
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}

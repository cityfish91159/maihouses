import React, { memo } from "react";
import { cn } from "../../../lib/utils";
import type { AiMessage } from "../../../types";

interface ChatBubbleProps {
  message: AiMessage;
}

export const ChatBubble = memo(({ message }: ChatBubbleProps) => {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex animate-[fadeIn_0.3s_ease-out]",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "shadow-sm min-w-0 max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-[15px]",
          isUser
            ? "bg-brand text-white rounded-tr-sm"
            : "bg-white border border-border-light text-text-primary rounded-tl-sm",
        )}
      >
        <div className="whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>
        {message.timestamp && (
          <div
            className={cn(
              "mt-1.5 text-xs",
              isUser ? "text-white/70" : "text-text-tertiary",
            )}
          >
            {new Date(message.timestamp).toLocaleTimeString("zh-TW", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
    </div>
  );
});

ChatBubble.displayName = "ChatBubble";

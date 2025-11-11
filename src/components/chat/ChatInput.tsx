import React, { useEffect, useRef, useState } from "react";
import { useQuietMode } from "../../context/QuietModeContext";
import { Events, track } from "../../analytics/track";

type Props = { onSend: (text: string) => Promise<void> | void; };

export const ChatInput: React.FC<Props> = ({ onSend }) => {
  const { isActive, decrementTurn } = useQuietMode();
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ text?: string }>;
      const seed = ce.detail?.text || "";
      if (seed) {
        setText(seed);
        inputRef.current?.focus();
        track("ui.warmbar_prefill", { from: "warmbar" });
      }
    };
    window.addEventListener("mai:chat:start", handler as EventListener);
    return () => window.removeEventListener("mai:chat:start", handler as EventListener);
  }, []);

  const handleSend = async () => {
    const msg = text.trim();
    if (!msg) return;
    setText("");
    try {
      await onSend(msg);
    } finally {
      if (isActive()) {
        decrementTurn();
        track(Events.QuietTurnUsed, {});
      }
    }
  };

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={isActive() ? "安靜模式：只聊天，不推內容" : "輸入訊息…"}
        style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd" }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      <button onClick={handleSend} style={{ padding: "8px 12px", borderRadius: 10, background: "#1749D7", color: "#fff", border: "1px solid #1749D7" }}>
        發送
      </button>
    </div>
  );
};

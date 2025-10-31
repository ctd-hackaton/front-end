import { useState, useRef, useEffect } from "react";
import { streamOpenAIUrl } from "../utils/firebase";
import styles from "../css/Chat.module.css";

function Chat() {
  const [message, setMessage] = useState("Create a meal plan for this week");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const handleSend = async () => {
    const trimmed = message.trim();

    if (!trimmed) {
      setError("Please enter a message");
      return;
    }

    if (!streamOpenAIUrl) {
      setError("Streaming endpoint is not configured.");
      return;
    }

    if (loading) {
      return;
    }

    const userId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-user`;
    const assistantId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-assistant`;
    const userMsg = { id: userId, role: "user", text: trimmed };
    const assistantMsg = { id: assistantId, role: "assistant", text: "" };

    let reader;
    let decoder;

    try {
      setLoading(true);
      setError(null);
      setMessages((m) => [...m, userMsg, assistantMsg]);
      setMessage("");

      if (inputRef.current) inputRef.current.focus();

      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch(streamOpenAIUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: trimmed }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to connect to streaming endpoint");
      }

      reader = response.body.getReader();
      decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          buffer += decoder.decode();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const rawEvent of events) {
          const lines = rawEvent.split("\n").filter(Boolean);
          let event = "data";
          let dataPayload = "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              event = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataPayload += line.slice(5).trimStart();
            }
          }

          if (!dataPayload) continue;

          if (event === "data" || event === "message") {
            try {
              const parsed = JSON.parse(dataPayload);
              if (parsed.delta) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantId
                      ? { ...msg, text: msg.text + parsed.delta }
                      : msg
                  )
                );
              }
            } catch (parseErr) {
              console.error("Failed to parse stream chunk", parseErr);
            }
          } else if (event === "end") {
            continue;
          } else if (event === "error") {
            try {
              const parsed = JSON.parse(dataPayload);
              throw new Error(parsed.message || "Streaming error");
            } catch (err) {
              throw err instanceof Error ? err : new Error("Streaming error");
            }
          }
        }
      }

      reader.releaseLock();
      reader = null;
    } catch (err) {
      if (err?.name === "AbortError") {
        return;
      }
      console.error("Error calling OpenAI function:", err);
      setError(err.message || "Failed to get response from OpenAI");
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId && !msg.text
            ? { ...msg, text: "(failed to retrieve response)" }
            : msg
        )
      );
    } finally {
      if (abortRef.current) {
        abortRef.current = null;
      }
      if (reader) {
        try {
          reader.cancel();
        } catch (_) {
          // ignore cancellation errors
        }
      }
      setLoading(false);
    }
  };

  // auto-scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.headerRow}>
        <h1>Chat</h1>
        <div className={styles.info}>OpenAI-powered assistant</div>
      </div>
      <div className={styles.messages} role="log" aria-live="polite">
        {messages.length === 0 && (
          <div className={styles.empty}>No messages yet — say hello 👋</div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user" ? styles.messageUser : styles.messageAssistant
            }
          >
            <div className={styles.messageText}>{m.text}</div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>
      <div className={styles.inputRow}>
        <textarea
          ref={inputRef}
          className={styles.input}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message and press Enter to send"
          rows={2}
          disabled={loading}
        />

        <div className={styles.controls}>
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
      <div className={styles.error}>{error || ""}</div>{" "}
    </div>
  );
}

export default Chat;

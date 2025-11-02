import { useState, useRef, useEffect } from "react";
import styles from "../css/ChatUI.module.css";

function ChatUI({
  onSend,
  initialMessages = [],
  title = "Chat",
  info = "AI-powered assistant",
  placeholder = "Type a message and press Enter to send",
  welcomeMsg = "No messages yet — say hello 👋",
}) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState(initialMessages);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const handleSend = async () => {
    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userMsg = { id: Date.now(), role: "user", text: message };
      setMessages((m) => [...m, userMsg]);
      setMessage("");
      if (inputRef.current) inputRef.current.focus();

      // Create a placeholder for streaming messages
      const streamingMsgId = Date.now() + 1;
      let isStreaming = false;

      const onMessageUpdate = (partialText) => {
        isStreaming = true;
        setMessages((m) => {
          const existing = m.find((msg) => msg.id === streamingMsgId);
          if (existing) {
            return m.map((msg) =>
              msg.id === streamingMsgId ? { ...msg, text: partialText } : msg
            );
          }
          return [
            ...m,
            { id: streamingMsgId, role: "assistant", text: partialText },
          ];
        });
      };

      const assistantMsg = await onSend(message, userMsg, onMessageUpdate);

      // If not streaming, add the final message
      if (!isStreaming && assistantMsg) {
        setMessages((m) => [...m, assistantMsg]);
      } else if (isStreaming && assistantMsg) {
        // Final update to ensure we have the complete message
        setMessages((m) =>
          m.map((msg) =>
            msg.id === streamingMsgId
              ? { ...msg, ...assistantMsg, id: streamingMsgId }
              : msg
          )
        );
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

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
        <h1>{title}</h1>
        <div className={styles.info}>{info}</div>
      </div>
      <div className={styles.messages} role="log" aria-live="polite">
        {messages.length === 0 && (
          <div className={styles.empty}>{welcomeMsg}</div>
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
          placeholder={placeholder}
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
      <div className={styles.error}>{error || ""}</div>
    </div>
  );
}

export default ChatUI;

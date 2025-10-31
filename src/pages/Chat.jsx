import { useState, useRef, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../utils/firebase";
import styles from "../css/Chat.module.css";

function Chat() {
  const [message, setMessage] = useState("How are you doing, ChatGPT");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  console.log(response);
  const handleSend = async () => {
    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // add user message to the list
      const userMsg = { id: Date.now(), role: "user", text: message };
      setMessages((m) => [...m, userMsg]);
      setResponse("");
      // focus input
      if (inputRef.current) inputRef.current.focus();

      const callOpenAI = httpsCallable(functions, "callOpenAI");
      const result = await callOpenAI({ message });

      const assistantMsg = {
        id: Date.now() + 1,
        role: "assistant",
        text: result.data.response || "(no response)",
      };

      setMessages((m) => [...m, assistantMsg]);
    } catch (err) {
      console.error("Error calling OpenAI function:", err);
      setError(err.message || "Failed to get response from OpenAI");
    } finally {
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
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}

export default Chat;

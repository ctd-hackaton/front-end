import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import styles from "../css/ChatUI.module.css";

const funLoadingMessages = [
  "📖 Chef is reading his old notes...",
  "🧐 Double-checking your preferences...",
  "✨ Enhancing deliciousness levels...",
  "🔍 Consulting the flavor archives...",
  "🎨 Adding artistic touches...",
  "👨‍🍳 Perfecting the techniques...",
  "🌟 Sprinkling some culinary magic...",
];

function ChatUI({
  onSend,
  initialMessages = [],
  title = "Chat",
  info = "AI-powered assistant",
  placeholder = "Type a message and press Enter to send",
  welcomeMsg = "No messages yet — say hello 👋",
  showRecipeButton = false,
  onGenerateRecipes,
  isGeneratingRecipes = false,
}) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState(initialMessages);
  const [chefThinkingMessage, setChefThinkingMessage] = useState(
    funLoadingMessages[0]
  );
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  // Check if this is Chef Jul (shows fun messages) or Julie (shows dots)
  // Julie lives in /dashboard, Chef Jul is elsewhere
  const isChefJul = !location.pathname.includes("/dashboard");

  // Rotate through fun loading messages while Chef Jul is thinking
  useEffect(() => {
    if (!loading || !isChefJul) return;

    const interval = setInterval(() => {
      setChefThinkingMessage(
        funLoadingMessages[
          Math.floor(Math.random() * funLoadingMessages.length)
        ]
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [loading, isChefJul]);
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
        if (!isStreaming) {
          isStreaming = true;
          // Hide "Thinking..." as soon as first chunk arrives
          setLoading(false);
        }
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
        setLoading(false);
      } else if (isStreaming && assistantMsg) {
        // Final update to ensure we have the complete message
        setMessages((m) =>
          m.map((msg) =>
            msg.id === streamingMsgId
              ? { ...msg, ...assistantMsg, id: streamingMsgId }
              : msg
          )
        );
        // Loading already set to false when streaming started
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err.message || "Failed to send message");
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
    <div
      className={`${styles.chatContainer} ${
        !isChefJul ? styles.julieChat : ""
      }`}
    >
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

        {loading && (
          <div className={styles.messageAssistant}>
            <div className={styles.messageText}>
              <span className={styles.thinkingMessage}>
                {isChefJul ? chefThinkingMessage : "Thinking..."}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
      {showRecipeButton && (
        <div className={styles.recipeButtonRow}>
          <button
            className={styles.recipeButton}
            onClick={onGenerateRecipes}
            disabled={isGeneratingRecipes}
          >
            {isGeneratingRecipes
              ? "Starting recipe generation..."
              : "📖 Create Detailed Recipes"}
          </button>
        </div>
      )}
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

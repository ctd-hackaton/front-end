import { useState, useRef, useEffect } from "react";
import styles from "../css/Chat.module.css";
import { functions } from "../utils/firebase";
import { httpsCallable } from "firebase/functions";
import { useAuth } from "../hooks/useAuth";
import { saveMessageToDB, loadMessageHistory, saveMealPlan } from "../utils/db";

function Chat() {
  const [message, setMessage] = useState("Create a meal plan for this week");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { currentUser } = useAuth();

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
      await saveMessageToDB(currentUser.uid, userMsg);
      if (inputRef.current) inputRef.current.focus();

      const callOpenAI = httpsCallable(functions, "callOpenAI");
      const result = await callOpenAI({ message });

      // If it's a meal plan, format the response with all sections from the mealPlan data
      let responseText = result.data.response;
      if (result.data.structured && result.data.mealPlan) {
        const { text } = result.data.mealPlan;
        responseText = `${
          text.weekOverview
        }\n\n--- Daily Overview ---\n${Object.entries(text.dailyDescription)
          .map(
            ([day, desc]) =>
              `${day.charAt(0).toUpperCase() + day.slice(1)}: ${desc}`
          )
          .join("\n\n")}\n\n--- Nutrition Summary ---\n${
          text.nutritionSummary
        }`;
      }

      const assistantMsg = {
        id: Date.now() + 1,
        role: "assistant",
        text: responseText,
        structured: result.data.structured,
        mealPlan: result.data.mealPlan,
      };

      setMessages((m) => [...m, assistantMsg]);
      await saveMessageToDB(currentUser.uid, assistantMsg);
    } catch (err) {
      console.error("Error calling OpenAI function:", err);
      setError(err.message || "Failed to get response from OpenAI");
    } finally {
      setLoading(false);
    }
  };

  // Load message history when component mounts
  useEffect(() => {
    async function loadHistory() {
      if (currentUser) {
        try {
          setLoading(true);
          const history = await loadMessageHistory(currentUser.uid);
          setMessages(history);
        } catch (err) {
          console.error("Error loading message history:", err);
          setError("Failed to load message history");
        } finally {
          setLoading(false);
        }
      }
    }

    loadHistory();
  }, [currentUser]);

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

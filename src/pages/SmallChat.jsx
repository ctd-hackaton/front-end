import { useCallback } from "react";
import { streamOpenAIUrl } from "../utils/firebase";
import ChatUI from "../components/ChatUI";

function SmallChat() {
  const handleSend = useCallback(async (messageText, _, onMessageUpdate) => {
    if (!streamOpenAIUrl) {
      throw new Error("Stream URL not configured");
    }

    const response = await fetch(streamOpenAIUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: messageText }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch streaming response");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            break;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullText += parsed.content;
              // Stream update via callback
              if (onMessageUpdate) {
                onMessageUpdate(fullText);
              }
            }
          } catch (error) {
            console.log(error);
          }
        }
      }
    }

    // Return final message
    return {
      role: "assistant",
      text: fullText,
    };
  }, []);

  return (
    <ChatUI
      onSend={handleSend}
      title="Sous-Chef Julie"
      info=""
      placeholder="Ask a quick question..."
      welcomeMsg={`Hi there! I'm Julie, your friendly sous‑chef. 
      I can help tweak and simplify Chef Jul's recipes — just say things like 
      "step 2 feels too complex" or "make it a bit spicier." 🍳`}
    />
  );
}

export default SmallChat;

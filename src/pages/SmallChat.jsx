import { useCallback, useMemo } from "react";
import { streamOpenAIUrl } from "../utils/firebase";
import ChatUI from "../components/ChatUI";

/** 
 * @param
    week: "2025-W44"
    day: "monday"
    type: "breakfast"
    meal: {
        "name": "Greek Yogurt with Berries",
        "description": "Creamy Greek yogurt topped with fresh berries and a drizzle of honey.",
        "ingredients": [
          {
            "item": "Greek yogurt",
            "amount": 1,
            "unit": "cup",
            "category": "Dairy"
          },
          {
            "item": "Mixed berries",
            "amount": 0.5,
            "unit": "cup",
            "category": "Fruits"
          },
          {
            "item": "Honey",
            "amount": 1,
            "unit": "tbsp",
            "category": "Sweeteners"
          }
        ],
        "nutrition": { "calories": 200, "protein": 10, "carbs": 25, "fats": 5 }
      },
}
 */
function SmallChat({ week, day, type, meal }) {
  const mealContext = useMemo(
    () =>
      week && day && type && meal
        ? {
            weekNumber: week,
            weekday: day,
            mealType: type,
            mealData: meal,
          }
        : null,
    [week, day, type, meal]
  );

  const handleSend = useCallback(
    async (messageText, _, onMessageUpdate) => {
      if (!streamOpenAIUrl) {
        throw new Error("Stream URL not configured");
      }

      const response = await fetch(streamOpenAIUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          mealContext: mealContext,
        }),
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
    },
    [mealContext]
  );

  // Generate welcome message based on meal context
  const welcomeMsg = mealContext
    ? `Hi! I'm Julie, your sous-chef. I can help you modify the ${mealContext.mealType} for ${mealContext.weekday}. 
       Tell me what you'd like to change - ingredients, cooking method, dietary preferences, or anything else! 🍳`
    : `Hi there! I'm Julie, your friendly sous‑chef. 
       I can help tweak and simplify Chef Jul's recipes — just say things like 
       "step 2 feels too complex" or "make it a bit spicier." 🍳`;

  const infoText = mealContext
    ? `Week ${mealContext.weekNumber} - ${mealContext.weekday} ${mealContext.mealType}`
    : "";

  return (
    <ChatUI
      onSend={handleSend}
      title="Sous-Chef Julie"
      info={infoText}
      placeholder="Ask a quick question..."
      welcomeMsg={welcomeMsg}
    />
  );
}

export default SmallChat;

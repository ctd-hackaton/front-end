import { useCallback, useMemo } from "react";
import { useLoaderData } from "react-router-dom";
import { functions } from "../utils/firebase";
import { httpsCallable } from "firebase/functions";
import { useAuth } from "../hooks/useAuth";
import { saveMessageToDB } from "../utils/db";
import ChatUI from "../components/ChatUI";

function Chat() {
  const { currentUser } = useAuth();
  const { messages } = useLoaderData();

  const initialMessages = useMemo(() => messages, [messages]);

  const handleSend = useCallback(
    async (messageText, userMsg) => {
      const callOpenAI = httpsCallable(functions, "callOpenAI");
      const result = await callOpenAI({ message: messageText });

      await saveMessageToDB(currentUser.uid, userMsg);

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

      await saveMessageToDB(currentUser.uid, assistantMsg);

      return assistantMsg;
    },
    [currentUser]
  );

  return (
    <ChatUI
      onSend={handleSend}
      initialMessages={initialMessages}
      title="Chef Jul"
      info="Meal Planner assistant"
      placeholder="Create a meal plan"
      welcomeMsg={`Hey there! I'm Chef Jul — your personal meal-planning assistant.
I can help you create delicious, balanced meals for the week or answer any culinary questions you might have.
Try asking something like:
"Create a low-carb Italian meal plan for this week." 🍝`}
    />
  );
}

export default Chat;

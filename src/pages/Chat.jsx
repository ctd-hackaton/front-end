import { useCallback, useMemo, useState, useEffect } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import { functions } from "../utils/firebase";
import { httpsCallable } from "firebase/functions";
import { useAuth } from "../hooks/useAuth";
import { saveMessageToDB, checkAndSummarizeHistory } from "../utils/db";
import ChatUI from "../components/ChatUI";

function Chat() {
  const { currentUser } = useAuth();
  const { messages } = useLoaderData();
  const navigate = useNavigate();
  const [latestMealPlan, setLatestMealPlan] = useState(null);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);
  const [currentMessages, setCurrentMessages] = useState(messages);

  const initialMessages = useMemo(() => currentMessages, [currentMessages]);

  // Check and summarize on mount and when messages change significantly
  useEffect(() => {
    const checkSummarization = async () => {
      if (!currentUser || currentMessages.length <= 20) return;
      
      const summarized = await checkAndSummarizeHistory(currentUser.uid, currentMessages);
      if (summarized.length !== currentMessages.length) {
        setCurrentMessages(summarized);
      }
    };

    checkSummarization();
  }, [currentUser, currentMessages.length]);

  const handleSend = useCallback(
    async (messageText, userMsg) => {
      try {
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

          // Store the meal plan info for recipe generation
          setLatestMealPlan({
            weekId: result.data.mealPlan.weekId,
            userId: currentUser.uid,
          });
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
      } catch (error) {
        console.error("Chat handleSend error:", error);
        throw new Error(
          `Failed to get response: ${error.message || "Unknown error"}`
        );
      }
    },
    [currentUser]
  );

  const handleGenerateRecipes = async () => {
    if (!latestMealPlan) return;

    setIsGeneratingRecipes(true);
    const startRecipeGeneration = httpsCallable(
      functions,
      "startRecipeGeneration"
    );

    try {
      await startRecipeGeneration({
        weekId: latestMealPlan.weekId,
      });

      // Clear the meal plan state so button doesn't show again
      setLatestMealPlan(null);
      setIsGeneratingRecipes(false);

      // Navigate to dashboard
      navigate("/dashboard", {
        state: { generatingRecipes: true, weekId: latestMealPlan.weekId },
      });
    } catch (error) {
      console.error("Failed to start recipe generation:", error);
      alert(error.message || "Failed to start recipe generation");
      setIsGeneratingRecipes(false);
    }
  };

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
      showRecipeButton={!!latestMealPlan && !isGeneratingRecipes}
      onGenerateRecipes={handleGenerateRecipes}
      isGeneratingRecipes={isGeneratingRecipes}
    />
  );
}

export default Chat;

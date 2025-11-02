require("dotenv").config();
const { onCall, onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const OpenAI = require("openai");
const admin = require("firebase-admin");
const { getISOWeek, getISOWeekYear } = require("date-fns");

if (!admin.apps || !admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (e) {}
}

const dbAdmin = admin.firestore();

exports.callOpenAI = onCall(async (request) => {
  const { message } = request.data;

  if (!message) {
    throw new Error("Message is required");
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const intentCheck = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an intent classifier. Respond with 'true' only if the user is requesting a meal plan or asking about meal planning. Otherwise respond with 'false'.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const intentContent = (
      intentCheck?.choices?.[0]?.message?.content ||
      intentCheck?.choices?.[0]?.text ||
      ""
    ).toString();
    const isMealPlanRequest = intentContent.toLowerCase().includes("true");

    const now = new Date();
    const currentWeekYear = getISOWeekYear(now);
    const currentWeekNum = getISOWeek(now);
    const currentWeekId = `${currentWeekYear}-W${String(
      currentWeekNum
    ).padStart(2, "0")}`;

    const completionOptions = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: isMealPlanRequest
            ? `You are a meal planning assistant. Create a COMPLETE week-long meal plan (Monday through Sunday, 7 days) and return a JSON object that includes both natural language responses and structured meal data. 

TODAY'S DATE: ${now.toISOString().split("T")[0]}
CURRENT WEEK: ${currentWeekId} (ISO Week ${currentWeekNum} of ${currentWeekYear})

IMPORTANT: You MUST include ALL 7 days of the week: monday, tuesday, wednesday, thursday, friday, saturday, and sunday.

The response should follow this exact structure:
{
  "weekId": "YYYY-W##",
  "text": {
    "weekOverview": "A friendly overview of the week's meal plan, highlighting variety and key features",
    "dailyDescription": {
      "monday": "Natural language description of Monday's meals (breakfast, lunch, dinner)",
      "tuesday": "Natural language description of Tuesday's meals (breakfast, lunch, dinner)",
      "wednesday": "Natural language description of Wednesday's meals (breakfast, lunch, dinner)",
      "thursday": "Natural language description of Thursday's meals (breakfast, lunch, dinner)",
      "friday": "Natural language description of Friday's meals (breakfast, lunch, dinner)",
      "saturday": "Natural language description of Saturday's meals (breakfast, lunch, dinner)",
      "sunday": "Natural language description of Sunday's meals (breakfast, lunch, dinner)"
    },
    "nutritionSummary": "Overview of nutritional balance and any recommendations for the full week"
  },
  "weekPlan": {
    "monday": {
      "breakfast": { "name": "", "description": "", "ingredients": [...], "nutrition": {...} },
      "lunch": { "name": "", "description": "", "ingredients": [...], "nutrition": {...} },
      "dinner": { "name": "", "description": "", "ingredients": [...], "nutrition": {...} }
    },
    "tuesday": { "breakfast": {...}, "lunch": {...}, "dinner": {...} },
    "wednesday": { "breakfast": {...}, "lunch": {...}, "dinner": {...} },
    "thursday": { "breakfast": {...}, "lunch": {...}, "dinner": {...} },
    "friday": { "breakfast": {...}, "lunch": {...}, "dinner": {...} },
    "saturday": { "breakfast": {...}, "lunch": {...}, "dinner": {...} },
    "sunday": { "breakfast": {...}, "lunch": {...}, "dinner": {...} }
  }
}

WEEK ID RULES:
- If user doesn't mention a week: use "${currentWeekId}"
- If user says "next week": use "${currentWeekYear}-W${String(
                currentWeekNum + 1
              ).padStart(2, "0")}"
- If user says "week 46" or "W46": use "${currentWeekYear}-W46"
- If user says "week 1 of 2026": use "2026-W01"
- Always format as "YYYY-W##" (e.g., "2025-W44")

Each meal should include:
- name: The name of the dish
- description: Brief description of the meal
- ingredients: Array of {item, amount, unit, category}
- nutrition: {calories (number), protein, carbs, fats}

Return ONLY the JSON object with all 7 days completed and correct weekId.`
            : "You are a helpful nutrition and wellness assistant. Engage in natural conversation while providing accurate and helpful information about nutrition, health, and wellness.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    };

    if (isMealPlanRequest) {
      completionOptions.response_format = { type: "json_object" };
    }

    const completion = await openai.chat.completions.create(completionOptions);

    const responseContent =
      completion.choices[0]?.message?.content ||
      completion.choices[0]?.text ||
      "";

    if (isMealPlanRequest) {
      try {
        let mealPlan;
        if (typeof responseContent === "string") {
          mealPlan = JSON.parse(responseContent);
        } else if (
          typeof responseContent === "object" &&
          responseContent !== null
        ) {
          mealPlan = responseContent;
        } else {
          throw new Error("Empty or unexpected responseContent from OpenAI");
        }

        logger.info("OpenAI meal plan received", { message });

        const userId = request?.auth?.uid || null;

        if (userId) {
          try {
            const weekId = mealPlan.weekId || currentWeekId;
            const [yearStr, weekStr] = weekId.split("-W");
            const year = parseInt(yearStr);
            const weekNumber = parseInt(weekStr);
            const jan4 = new Date(year, 0, 4);
            const jan4Day = jan4.getDay() || 7;
            const jan4Monday = new Date(jan4);
            jan4Monday.setDate(jan4.getDate() - jan4Day + 1);

            const weekStartDate = new Date(jan4Monday);
            weekStartDate.setDate(jan4Monday.getDate() + (weekNumber - 1) * 7);
            weekStartDate.setHours(0, 0, 0, 0);

            const weekEndDate = new Date(weekStartDate);
            weekEndDate.setDate(weekStartDate.getDate() + 6);
            weekEndDate.setHours(23, 59, 59, 999);

            const docRef = dbAdmin.doc(`users/${userId}/mealPlans/${weekId}`);
            await docRef.set({
              ...mealPlan,
              id: weekId,
              weekId: weekId,
              weekStartDate: admin.firestore.Timestamp.fromDate(weekStartDate),
              weekEndDate: admin.firestore.Timestamp.fromDate(weekEndDate),
              year: year,
              weekNumber: weekNumber,
              createdAt: admin.firestore.Timestamp.now(),
              updatedAt: admin.firestore.Timestamp.now(),
            });
          } catch (err) {
            console.error("Failed to save meal plan to Firestore:", err);
          }
        }

        return {
          success: true,
          response: mealPlan.text.weekOverview,
          structured: true,
          mealPlan: mealPlan,
        };
      } catch (error) {
        logger.error("Failed to parse or save meal plan JSON", error);
        return {
          success: true,
          response:
            "I encountered an error creating your meal plan. Could you please try asking again?",
          structured: false,
        };
      }
    }

    logger.info("OpenAI conversation response received", { message });
    return {
      success: true,
      response: responseContent,
      structured: false,
    };
  } catch (error) {
    logger.error("OpenAI error:", error);
    console.error(
      "OpenAI error stack:",
      error && error.stack ? error.stack : error
    );

    throw new Error(
      `Failed to call OpenAI: ${error.message || "unknown error"}`
    );
  }
});

exports.streamOpenAI = onRequest(async (req, res) => {
  // Handle CORS
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  const { message, mealContext } = req.body;

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Build system prompt based on whether we have meal context
    let systemPrompt = `You are Julie, a friendly sous-chef assistant.`;
    const hasMealContext = mealContext && mealContext.mealData;

    if (hasMealContext) {
      const { weekday, mealType, mealData, weekNumber } = mealContext;
      systemPrompt += ` You are helping the user modify their ${mealType} meal for ${weekday} (Week ${weekNumber}).
      
Current meal details:
- Name: ${mealData.name}
- Description: ${mealData.description}
- Ingredients: ${mealData.ingredients
        .map((i) => `${i.amount} ${i.unit} ${i.item}`)
        .join(", ")}
- Nutrition: ${mealData.nutrition.calories} cal, ${
        mealData.nutrition.protein
      }g protein, ${mealData.nutrition.carbs}g carbs, ${
        mealData.nutrition.fats
      }g fats

IMPORTANT: Always respond with a JSON object in this exact format:
{
  "message": "Your friendly natural language response",
  "updatedMeal": {
    "name": "meal name",
    "description": "meal description",
    "ingredients": [
      {"item": "ingredient name", "amount": number, "unit": "unit", "category": "category"}
    ],
    "nutrition": {"calories": number, "protein": number, "carbs": number, "fats": number}
  }
}

- If the user requests changes: Return the MODIFIED meal in updatedMeal
- If the user is just asking questions: Return the CURRENT meal (unchanged) in updatedMeal
- Never return null for updatedMeal

Always maintain a similar nutritional profile unless they specifically request otherwise.
Be concise, helpful, and encouraging in your message.`;
    } else {
      systemPrompt += ` You help users understand and modify recipes.
      Be concise, helpful, and encouraging. When users ask about simplifying steps or adjusting recipes,
      provide clear, practical advice.`;
    }

    const completionOptions = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    };

    // For meal modifications, request structured JSON output (non-streaming)
    if (hasMealContext) {
      completionOptions.response_format = { type: "json_object" };

      const completion = await openai.chat.completions.create(
        completionOptions
      );
      const responseContent = completion.choices[0]?.message?.content || "{}";

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseContent);
      } catch (error) {
        parsedResponse = {
          message: responseContent,
          updatedMeal: null,
        };
      }

      // Stream the natural language message
      const messageText = parsedResponse.message || "";
      for (let i = 0; i < messageText.length; i += 3) {
        const chunk = messageText.slice(i, i + 3);
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        // Small delay to simulate streaming
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      // Send the structured data as a separate event
      if (parsedResponse.updatedMeal) {
        res.write(
          `data: ${JSON.stringify({
            type: "structured",
            updatedMeal: parsedResponse.updatedMeal,
          })}\n\n`
        );
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } else {
      // For general chat, use streaming
      completionOptions.stream = true;
      const stream = await openai.chat.completions.create(completionOptions);

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    }

    logger.info("OpenAI streaming response completed", { message });
  } catch (error) {
    logger.error("OpenAI streaming error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "unknown error" });
    }
  }
});

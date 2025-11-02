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

// Constants
const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const MEAL_TYPES = ["breakfast", "lunch", "dinner"];

// Helper function to get meal image URL from Foodish API
// Simple API call - returns random food image URL
async function getMealImageUrl(mealName) {
  const https = require("https");

  return new Promise((resolve) => {
    const req = https.get(
      "https://foodish-api.com/api/",
      { timeout: 3000 },
      (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const response = JSON.parse(data);
            resolve(
              response.image || "https://via.placeholder.com/600x400?text=Food"
            );
          } catch (e) {
            resolve("https://via.placeholder.com/600x400?text=Food");
          }
        });
      }
    );

    req.on("error", () => {
      resolve("https://via.placeholder.com/600x400?text=Food");
    });

    req.on("timeout", () => {
      req.destroy();
      resolve("https://via.placeholder.com/600x400?text=Food");
    });
  });
}

// Helper function to fetch user preferences from Firestore
async function fetchUserPreferences(userId, context = "Chef Jul") {
  if (!userId) return null;

  try {
    const userDoc = await dbAdmin.doc(`users/${userId}`).get();
    if (userDoc.exists()) {
      return userDoc.data();
    }
  } catch (err) {
    logger.warn(`Could not fetch user preferences for ${context}`, {
      error: err.message,
    });
  }
  return null;
}

// Helper function to build user context string from preferences
function buildUserContext(userPreferences) {
  if (!userPreferences) return "";

  const parts = [];

  // Personal data
  if (userPreferences.personalData) {
    const { age, weightKg, heightCm, activityLevel } =
      userPreferences.personalData;
    const personalParts = [];
    if (age) personalParts.push(`Age: ${age}`);
    if (weightKg) personalParts.push(`Weight: ${weightKg}kg`);
    if (heightCm) personalParts.push(`Height: ${heightCm}cm`);
    if (activityLevel) personalParts.push(`Activity level: ${activityLevel}`);
    if (personalParts.length > 0) parts.push(personalParts.join(", "));
  }

  // Preferences
  if (userPreferences.preferences) {
    const {
      dietType,
      favoriteCuisine,
      excludedIngredientRefs,
      allergyIngredientRefs,
    } = userPreferences.preferences;
    const prefParts = [];
    if (dietType && dietType !== "none") prefParts.push(`Diet: ${dietType}`);
    if (favoriteCuisine?.length > 0) {
      prefParts.push(`Favorite cuisines: ${favoriteCuisine.join(", ")}`);
    }
    if (excludedIngredientRefs?.length > 0) {
      prefParts.push(
        `Excluded ingredients: ${excludedIngredientRefs.join(", ")}`
      );
    }
    if (prefParts.length > 0) parts.push(prefParts.join(", "));

    // Allergies - emphasize
    if (allergyIngredientRefs?.length > 0) {
      parts.push(
        `⚠️ ALLERGIES: ${allergyIngredientRefs.join(", ")} - MUST AVOID!`
      );
    }
  }

  // Goals
  if (userPreferences.goals) {
    const {
      dailyCalorieTarget,
      proteinGoalGrams,
      carbsGoalGrams,
      fatsGoalGrams,
    } = userPreferences.goals;
    const goalParts = [];
    if (dailyCalorieTarget)
      goalParts.push(`Daily calorie target: ${dailyCalorieTarget} kcal`);
    const macroParts = [];
    if (proteinGoalGrams) macroParts.push(`${proteinGoalGrams}g protein`);
    if (carbsGoalGrams) macroParts.push(`${carbsGoalGrams}g carbs`);
    if (fatsGoalGrams) macroParts.push(`${fatsGoalGrams}g fats`);
    if (macroParts.length > 0)
      goalParts.push(`Daily macro goals: ${macroParts.join(", ")}`);
    if (goalParts.length > 0) parts.push(goalParts.join(", "));
  }

  if (parts.length > 0) {
    return `\n\nUSER PROFILE:\n${parts.join("\n")}`;
  }
  return "";
}

// Helper function to get allergy warning if user has allergies
function getAllergyWarning(userPreferences) {
  if (userPreferences?.preferences?.allergyIngredientRefs?.length > 0) {
    return "\n⚠️ CRITICAL: User has allergies! NEVER include allergenic ingredients in any meal!";
  }
  return "";
}

// Helper function to generate recipes for all meals in a week plan
async function generateRecipesForMealPlan(userId, weekId, weekPlan) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Fetch user preferences for allergen and dietary information
  const userPreferences = await fetchUserPreferences(
    userId,
    "Recipe Generator"
  );
  const userContext = buildUserContext(userPreferences);
  const allergyWarning = getAllergyWarning(userPreferences);

  logger.info("Starting background recipe generation", { weekId, userId });

  const docRef = dbAdmin.doc(`users/${userId}/mealPlans/${weekId}`);

  // Build list of all meals to process
  const mealsToProcess = [];
  for (const day of DAYS_OF_WEEK) {
    for (const mealType of MEAL_TYPES) {
      const meal = weekPlan[day]?.[mealType];
      if (meal && meal.name && meal.ingredients) {
        mealsToProcess.push({ day, mealType, meal });
      }
    }
  }

  // Process in batches of 5 for optimal performance
  const BATCH_SIZE = 5;
  let completedCount = 0;

  for (let i = 0; i < mealsToProcess.length; i += BATCH_SIZE) {
    // Check if cancelled before each batch
    const currentDoc = await docRef.get();
    const status = currentDoc.data()?.recipeGenerationStatus;

    if (status?.cancelled) {
      logger.info("Recipe generation cancelled by user", { weekId });
      await docRef.update({
        "recipeGenerationStatus.isGenerating": false,
        "recipeGenerationStatus.cancelledAt": admin.firestore.Timestamp.now(),
      });
      return;
    }

    const batch = mealsToProcess.slice(i, i + BATCH_SIZE);

    // Process batch in parallel
    const batchPromises = batch.map(async ({ day, mealType, meal }) => {
      try {
        const ingredientList = meal.ingredients
          .map((ing) => `${ing.amount} ${ing.unit} ${ing.item}`)
          .join(", ");

        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a professional chef. Generate a detailed recipe in JSON format.${userContext}${allergyWarning}

Return ONLY a JSON object with this structure:
{
  "prepTime": "15 minutes",
  "cookTime": "25 minutes",
  "servings": 2,
  "difficulty": "Easy",
  "steps": [
    "Detailed step 1 with clear instructions",
    "Detailed step 2 with clear instructions",
    "Detailed step 3 with clear instructions",
    ...
  ],
  "tips": [
    "Helpful cooking tip 1",
    "Helpful cooking tip 2"
  ]
}

IMPORTANT:
- Include 5-8 detailed, clear steps
- Each step should be actionable and specific
- Include exact temperatures, times, and techniques
- Add 2-3 helpful tips for best results`,
            },
            {
              role: "user",
              content: `Generate a recipe for: ${meal.name}
            
Description: ${meal.description || "A delicious meal"}
Ingredients: ${ingredientList}

Create detailed cooking instructions that will help someone successfully prepare this dish.`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        });

        const recipeData = JSON.parse(
          completion.choices[0]?.message?.content || "{}"
        );

        // Update the meal with recipe in Firestore (image already exists from meal plan creation)
        await docRef.update({
          [`weekPlan.${day}.${mealType}.recipe`]: recipeData,
          "recipeGenerationStatus.progress":
            admin.firestore.FieldValue.increment(1),
        });

        logger.info("Recipe generated and saved", {
          weekId,
          day,
          mealType,
          mealName: meal.name,
        });

        return { success: true, day, mealType };
      } catch (error) {
        logger.error("Failed to generate recipe for meal:", {
          error: error.message,
          weekId,
          day,
          mealType,
          mealName: meal.name,
        });
        // Increment progress even on failure so UI doesn't get stuck
        await docRef.update({
          "recipeGenerationStatus.progress":
            admin.firestore.FieldValue.increment(1),
        });
        return { success: false, day, mealType, error: error.message };
      }
    });

    // Wait for entire batch to complete
    const results = await Promise.all(batchPromises);
    completedCount += results.length;

    logger.info(`Batch completed: ${completedCount}/${mealsToProcess.length}`, {
      weekId,
      batchResults: results,
    });

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < mealsToProcess.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Mark as complete
  await docRef.update({
    "recipeGenerationStatus.isGenerating": false,
    "recipeGenerationStatus.completedAt": admin.firestore.Timestamp.now(),
  });

  logger.info("Background recipe generation completed", { weekId, userId });
}

exports.callOpenAI = onCall(async (request) => {
  const { message } = request.data;

  if (!message) {
    throw new Error("Message is required");
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Fetch user preferences if authenticated
    const userId = request?.auth?.uid || null;
    const userPreferences = await fetchUserPreferences(userId, "Chef Jul");

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

    // Build user context and allergy warning using helpers
    const userContext = buildUserContext(userPreferences);
    const allergyWarning = getAllergyWarning(userPreferences);

    const completionOptions = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: isMealPlanRequest
            ? `You are a meal planning assistant. Create a COMPLETE week-long meal plan (Monday through Sunday, 7 days) and return a JSON object that includes both natural language responses and structured meal data.${userContext}

TODAY'S DATE: ${now.toISOString().split("T")[0]}
CURRENT WEEK: ${currentWeekId} (ISO Week ${currentWeekNum} of ${currentWeekYear})

IMPORTANT: You MUST include ALL 7 days of the week: monday, tuesday, wednesday, thursday, friday, saturday, and sunday.${allergyWarning}

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
- description: Brief description of the meal (2-3 sentences)
- ingredients: Array of {item, amount, unit, category}
- nutrition: {calories (number), protein (grams), carbs (grams), fats (grams)}

IMPORTANT: 
- Do NOT include recipe field - recipes will be generated separately
- Focus on meal variety, nutritional balance, and interesting ingredient combinations
- Keep descriptions appetizing and informative

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

            // Fetch images for all meals in parallel
            const imagePromises = [];

            for (const day of DAYS_OF_WEEK) {
              for (const mealType of MEAL_TYPES) {
                if (mealPlan.weekPlan[day]?.[mealType]?.name) {
                  imagePromises.push(
                    getMealImageUrl(mealPlan.weekPlan[day][mealType].name).then(
                      (imageUrl) => ({
                        day,
                        mealType,
                        imageUrl,
                      })
                    )
                  );
                }
              }
            }

            // Wait for all images to be fetched
            const imageResults = await Promise.all(imagePromises);

            // Add image URLs to meal plan
            for (const { day, mealType, imageUrl } of imageResults) {
              if (mealPlan.weekPlan[day]?.[mealType]) {
                mealPlan.weekPlan[day][mealType].imageUrl = imageUrl;
              }
            }

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
            logger.info("Meal plan saved to Firestore with images", {
              weekId,
              userId,
              imageCount: imageResults.length,
            });
          } catch (err) {
            logger.error("Failed to save meal plan to Firestore:", {
              error: err.message,
              stack: err.stack,
              weekId,
            });
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
    logger.error("OpenAI error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

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

    // Fetch user preferences if authenticated using helper
    const userPreferences = await fetchUserPreferences(req.auth?.uid, "Julie");

    // Build user context and allergy warning using helpers
    const userContext = buildUserContext(userPreferences);
    const allergyWarning = getAllergyWarning(userPreferences);

    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Build system prompt based on whether we have meal context
    let systemPrompt = `You are Julie, a friendly sous-chef assistant.`;
    const hasMealContext = mealContext && mealContext.mealData;

    if (hasMealContext) {
      const { weekday, mealType, mealData, weekNumber } = mealContext;
      systemPrompt += ` You are helping the user modify their ${mealType} meal for ${weekday} (Week ${weekNumber}).${userContext}${allergyWarning}
      
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
      systemPrompt += ` You help users understand and modify recipes.${userContext}${allergyWarning}

When users ask about recipes, cooking instructions, or how to prepare meals:
- Provide DETAILED, step-by-step instructions
- Include prep time, cook time, and difficulty level when relevant
- Break down complex steps into simple, actionable instructions
- Include helpful tips, techniques, and safety notes
- Explain why certain steps are important
- Be thorough but conversational and encouraging

When users ask simple questions or request modifications:
- Provide clear, practical advice
- Be concise but helpful`;
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
      max_tokens: 2500,
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

exports.startRecipeGeneration = onCall(
  { timeoutSeconds: 60, memory: "256MiB" },
  async (request) => {
    const { weekId } = request.data;
    const userId = request.auth?.uid;

    if (!userId || !weekId) {
      throw new Error("weekId and authenticated user required");
    }

    const docRef = dbAdmin.doc(`users/${userId}/mealPlans/${weekId}`);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error("Meal plan not found");
    }

    // Check if already generating
    const status = doc.data().recipeGenerationStatus;
    if (status?.isGenerating) {
      throw new Error("Recipe generation already in progress");
    }

    // Set initial status
    await docRef.update({
      "recipeGenerationStatus.isGenerating": true,
      "recipeGenerationStatus.progress": 0,
      "recipeGenerationStatus.total": 21,
      "recipeGenerationStatus.startedAt": admin.firestore.Timestamp.now(),
      "recipeGenerationStatus.completedAt": null,
      "recipeGenerationStatus.cancelled": false,
    });

    logger.info("Recipe generation started", { weekId, userId });

    // Trigger background generation (don't await)
    generateRecipesForMealPlan(userId, weekId, doc.data().weekPlan).catch(
      (err) => {
        logger.error("Background recipe generation failed:", {
          error: err.message,
          weekId,
        });
      }
    );

    return { success: true, weekId };
  }
);

exports.cancelRecipeGeneration = onCall(async (request) => {
  const { weekId } = request.data;
  const userId = request.auth?.uid;

  if (!userId || !weekId) {
    throw new Error("weekId and authenticated user required");
  }

  await dbAdmin.doc(`users/${userId}/mealPlans/${weekId}`).update({
    "recipeGenerationStatus.cancelled": true,
    "recipeGenerationStatus.cancelledAt": admin.firestore.Timestamp.now(),
  });

  logger.info("Recipe generation cancelled", { weekId, userId });

  return { success: true };
});

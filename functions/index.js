require("dotenv").config();
const { onCall, onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const OpenAI = require("openai");

exports.callOpenAI = onCall(async (request) => {
  const { message } = request.data;

  if (!message) {
    throw new Error("Message is required");
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // First, check if this is a meal planning request
    const intentCheck = await openai.chat.completions.create({
      model: "gpt-4",
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

    const isMealPlanRequest = intentCheck.choices[0]?.message?.content
      .toLowerCase()
      .includes("true");

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: isMealPlanRequest
            ? `You are a meal planning assistant. When creating a meal plan, return a JSON object with the following structure:
              {
                "weekPlan": {
                  "monday": { "breakfast": { "name": "", "recipe": "", "ingredients": [] }, "lunch": {...}, "dinner": {...} },
                  "tuesday": {...}
                },
                "groceryList": [
                  { "item": "", "category": "", "amount": "", "unit": "" }
                ],
                "nutritionSummary": {
                  "averageCaloriesPerDay": number,
                  "macroBreakdown": { "protein": "", "carbs": "", "fats": "" }
                }
              }`
            : "You are a helpful nutrition and wellness assistant. Engage in natural conversation while providing accurate and helpful information about nutrition, health, and wellness.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (isMealPlanRequest) {
      try {
        const mealPlan = JSON.parse(responseContent);
        logger.info("OpenAI meal plan received", { message });
        return {
          success: true,
          response: responseContent,
          structured: true,
          mealPlan: mealPlan,
        };
      } catch (error) {
        logger.error("Failed to parse meal plan JSON", error);
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
    throw new Error(`Failed to call OpenAI: ${error.message}`);
  }
});

const setCorsHeaders = (req, res) => {
  const origin = req.get("Origin") || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (origin !== "*") {
    res.setHeader("Vary", "Origin");
  }
};

exports.streamOpenAI = onRequest(async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { message } = req.body || {};

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const varyHeader = res.getHeader("Vary");
  const responseHeaders = {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": res.getHeader("Access-Control-Allow-Origin"),
    "Access-Control-Allow-Methods": res.getHeader(
      "Access-Control-Allow-Methods"
    ),
    "Access-Control-Allow-Headers": res.getHeader(
      "Access-Control-Allow-Headers"
    ),
  };

  if (varyHeader) {
    responseHeaders.Vary = varyHeader;
  }

  res.writeHead(200, responseHeaders);

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let streamAborted = false;

  req.on("close", () => {
    streamAborted = true;
  });

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4",
      stream: true,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    for await (const part of stream) {
      if (streamAborted) {
        break;
      }

      const delta = part.choices[0]?.delta?.content;
      if (delta) {
        sendEvent("data", { delta });
      }
    }

    if (!streamAborted) {
      sendEvent("end", { done: true });
      res.end();
    }
  } catch (error) {
    logger.error("OpenAI streaming error:", error);
    if (!streamAborted) {
      res.statusCode = 500;
      sendEvent("error", {
        message: error.message || "Failed to stream response",
      });
      res.end();
    }
  }
});

require('dotenv').config();
const {onCall} = require("firebase-functions/v2/https");
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

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    const responseMessage = completion.choices[0]?.message?.content || "No response from OpenAI";

    logger.info("OpenAI response received", { message });
    
    return {
      success: true,
      response: responseMessage,
    };
  } catch (error) {
    logger.error("OpenAI error:", error);
    throw new Error(`Failed to call OpenAI: ${error.message}`);
  }
});

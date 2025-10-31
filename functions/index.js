require("dotenv").config();
const {onCall, onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const OpenAI = require("openai");

exports.callOpenAI = onCall(async (request) => {
  const {message} = request.data;

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

    const responseMessage = completion.choices[0]?.message?.content ||
      "No response from OpenAI";

    logger.info("OpenAI response received", {message});

    return {
      success: true,
      response: responseMessage,
    };
  } catch (error) {
    logger.error("OpenAI error:", error);
    throw new Error(`Failed to call OpenAI: ${error.message}`);
  }
});

exports.streamOpenAI = onRequest(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  const {message} = req.body || {};

  if (!message || typeof message !== "string") {
    res.status(400).json({error: "Message is required"});
    return;
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

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
      model: "gpt-4o-mini",
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
        sendEvent("data", {delta});
      }
    }

    if (!streamAborted) {
      sendEvent("end", {done: true});
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

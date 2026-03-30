const express = require("express");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/summarize", auth, async (req, res, next) => {
  try {
    const { title, description = "" } = req.body || {};

    if (!title || typeof title !== "string") {
      const error = new Error("Title is required");
      error.status = 400;
      throw error;
    }

    if (!process.env.GROQ_API_KEY) {
      const error = new Error("GROQ_API_KEY is missing in environment");
      error.status = 500;
      throw error;
    }

    const prompt =
      "Summarize this task in one short sentence.\n" +
      `Title: ${title}\n` +
      `Description: ${description}`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(
        data?.error?.message || "Failed to generate task summary"
      );
      error.status = response.status || 500;
      throw error;
    }

    const summary = data?.choices?.[0]?.message?.content?.trim();
    if (!summary) {
      const error = new Error("Groq returned an empty summary");
      error.status = 500;
      throw error;
    }

    return res.status(200).json({ summary });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

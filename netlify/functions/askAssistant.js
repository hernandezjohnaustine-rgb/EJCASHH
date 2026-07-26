const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { message, history, systemInstruction } = JSON.parse(event.body || "{}");
    if (!message || typeof message !== "string") {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing 'message' field" }) };
    }

    // Convert prior turns (if any) into Gemini's `contents` format, then
    // append the new message. `history` items use { role: "user"|"assistant", content }.
    const contents = [
      ...(Array.isArray(history)
        ? history.map((h) => ({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: h.content }],
          }))
        : []),
      { role: "user", parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
      contents,
      config: {
        systemInstruction: systemInstruction || "You are a helpful assistant.",
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply: response.text || "Sorry, no response was generated." }),
    };
  } catch (err) {
    console.error("Gemini proxy error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to get AI response" }) };
  }
};

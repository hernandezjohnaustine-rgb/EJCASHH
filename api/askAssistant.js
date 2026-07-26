// Uses Groq (https://console.groq.com) instead of Gemini — a genuinely free
// tier with no credit card requirement, unlike Gemini's 2026 prepaid billing
// changes. OpenAI-compatible REST API, called via plain fetch (no extra
// npm dependency needed).

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history, systemInstruction } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing 'message' field" });
    }

    const messages = [
      { role: "system", content: systemInstruction || "You are a helpful assistant." },
      ...(Array.isArray(history)
        ? history.map((h) => ({
            role: h.role === "assistant" ? "assistant" : "user",
            content: h.content,
          }))
        : []),
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", data);
      return res.status(500).json({ error: data.error?.message || "Failed to get AI response" });
    }

    const reply = data.choices?.[0]?.message?.content || "Sorry, no response was generated.";
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Groq proxy error:", err);
    return res.status(500).json({ error: "Failed to get AI response" });
  }
}

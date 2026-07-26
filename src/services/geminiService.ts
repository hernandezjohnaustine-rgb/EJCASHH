// IMPORTANT: replace this with your actual Netlify function URL once deployed
// (Site settings will show it, e.g. https://your-site-name.netlify.app/.netlify/functions/askAssistant)
const AI_PROXY_URL = "https://ejcashh.vercel.app/api/askAssistant";

export async function askAssistant(prompt: string) {
  try {
    const response = await fetch(AI_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: prompt,
        systemInstruction:
          "You are the EJCASHH Smart Assistant, an expert in fintech and the EJCASHH ecosystem. Help users understand how to grow their business, manage earnings, and use the EJCASHH platform features like Trading, Marketplace, and Referral rewards. Keep your tone professional yet encouraging.",
      }),
    });
    if (!response.ok) throw new Error("Proxy request failed: " + response.status);
    const data = await response.json();
    return data.reply || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm sorry, I'm having trouble connecting to my brain right now.";
  }
}

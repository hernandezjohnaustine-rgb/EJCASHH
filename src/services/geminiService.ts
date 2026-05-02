import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function askAssistant(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are the EJCASHH Smart Assistant, an expert in fintech and the EJCASHH ecosystem. Help users understand how to grow their business, manage earnings, and use the EJCASHH platform features like Trading, Marketplace, and Referral rewards. Keep your tone professional yet encouraging.",
      }
    });
    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm sorry, I'm having trouble connecting to my brain right now.";
  }
}

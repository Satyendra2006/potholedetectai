import { GoogleGenAI } from "@google/genai";

const STORAGE_KEY = "potholedetectai_gemini_key";

function getApiKey(): string {
  // Runtime: prefer localStorage key (user-configured), then fall back to build-time env
  return localStorage.getItem(STORAGE_KEY) || process.env.GEMINI_API_KEY || "";
}

export function saveApiKey(key: string) {
  localStorage.setItem(STORAGE_KEY, key);
}

export function getStoredApiKey(): string {
  return localStorage.getItem(STORAGE_KEY) || "";
}

export function clearApiKey() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function detectPotholes(imageBase64: string) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("NO_API_KEY");

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-2.0-flash";

  const prompt = `
    Analyze this road image for potholes and road damage.
    Return ONLY a valid JSON object with NO markdown or code fences, containing:
    1. "potholes": array of objects, each with:
       - "box_2d": [ymin, xmin, ymax, xmax] (integers scaled 0-1000)
       - "label": short description string
       - "severity": exactly one of "low", "medium", or "high"
    2. "damage_summary": a 1-2 sentence string summarizing the road condition.
    3. "estimated_repair_priority": integer from 1-10.
    
    If no potholes are detected, return {"potholes":[],"damage_summary":"Road surface appears in good condition.","estimated_repair_priority":1}
  `.trim();

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json"
    }
  });

  const raw = response.text || "{}";
  // Strip markdown fences if model still returns them
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

export async function askMentor(message: string) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("NO_API_KEY");

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-2.0-flash";

  const systemInstruction = `
    You are an expert Computer Vision Engineer and YOLO specialist mentor.
    Your specialty is Ultralytics YOLOv8-seg for road damage segmentation.
    Be technical, precise, and concise. Keep responses under 150 words.
  `.trim();

  const response = await ai.models.generateContent({
    model,
    contents: message,
    config: { systemInstruction }
  });
  return response.text;
}


import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function detectPotholes(imageBase64: string) {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze this road image for potholes. 
    Return a JSON object with:
    1. "potholes": list of objects, each with "box_2d" [ymin, xmin, ymax, xmax] (scaled 0-1000), "label", and "severity" (low, medium, high).
    2. "damage_summary": a string summarizing the road condition.
    3. "estimated_repair_priority": 1-10.
    
    If no potholes, return an empty list.
  `.trim();

  try {
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

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Detection Error:", error);
    return { potholes: [], damage_summary: "Error during analysis.", estimated_repair_priority: 0 };
  }
}

export async function askMentor(message: string, context?: any) {
  const model = "gemini-3-pro-preview";
  
  const systemInstruction = `
    You are an expert Computer Vision Engineer and YOLO specialist mentor.
    Your specialty is Ultralytics YOLOv8-seg for road damage segmentation.
    Be technical, precise, and helpful. 
    If context about a pothole detection is provided, use it to give specific advice.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: message,
      config: {
        systemInstruction
      }
    });
    return response.text;
  } catch (error) {
    console.error("Mentor Error:", error);
    return "I'm having trouble connecting to my mentor brain right now.";
  }
}

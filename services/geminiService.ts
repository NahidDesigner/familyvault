
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SUPPORTED_IMAGE_MIMES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/heic',
  'image/heif'
];

export async function analyzeMedia(base64Data: string, mimeType: string) {
  // If the MIME type is not explicitly supported by Gemini for direct image analysis, 
  // skip the API call to avoid 400 errors.
  if (!SUPPORTED_IMAGE_MIMES.includes(mimeType)) {
    console.warn(`Skipping AI analysis for unsupported MIME type: ${mimeType}`);
    return { description: "Shared media upload", tags: ["Gallery", "File"] };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "Describe this image briefly (max 15 words) and provide 3 relevant one-word tags for a photo gallery.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["description", "tags"],
        },
      },
    });

    if (!response.text) {
        throw new Error("Empty response from Gemini");
    }

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Analysis failed:", error);
    // Return a graceful fallback instead of throwing
    return { description: "Shared media upload", tags: ["Gallery"] };
  }
}

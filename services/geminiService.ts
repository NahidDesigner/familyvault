
import { GoogleGenAI, Type } from "@google/genai";

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
    // Fix: Initialize GoogleGenAI strictly using process.env.API_KEY in a named object parameter.
    // The application must assume API_KEY is pre-configured and accessible.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Fix: Use the correct model name and generateContent method following guidelines.
    // Use gemini-3-flash-preview for general vision tasks.
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
            description: {
              type: Type.STRING,
              description: 'Brief description of the image content.',
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Three relevant one-word tags.',
            },
          },
          required: ["description", "tags"],
          propertyOrdering: ["description", "tags"],
        },
      },
    });

    // Fix: Access .text property directly (not a method call) as per GenerateContentResponse definition.
    const output = response.text?.trim();
    if (!output) {
        throw new Error("Empty response from Gemini");
    }

    return JSON.parse(output);
  } catch (error) {
    console.error("AI Analysis failed:", error);
    // Return a graceful fallback instead of throwing to ensure UI stability
    return { description: "Shared media upload", tags: ["Gallery"] };
  }
}

import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  // According to coding guidelines, we must use process.env.API_KEY exclusively.
  // This assumes process.env.API_KEY is available in the environment.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("API Key not found. Please check your .env file or build configuration.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to extract image from Gemini 2.5 Flash Image response
const extractImageFromResponse = (response: any): string | null => {
  if (!response || !response.candidates || !response.candidates[0]?.content?.parts) {
    return null;
  }

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData && part.inlineData.data) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const generateSceneImage = async (sceneDescription: string): Promise<string | null> => {
  const client = getClient();
  if (!client) return null;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{
          text: `Create a clean, text-free vector art illustration in digital city style, flat design, modern colors. The scene depicts: ${sceneDescription}. NO WORDS, NO LABELS, NO TEXT. Aspect ratio 16:9.`
        }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          // outputMimeType is not supported for gemini-2.5-flash-image
        }
      }
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Error generating scene image:", error);
    return null;
  }
};

export const generateCharacterImage = async (characterName: string, mood: string = 'neutral'): Promise<string | null> => {
  const client = getClient();
  if (!client) return null;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{
          text: `Create a vector art avatar portrait of a character named "${characterName}", looking ${mood}. Digital city style, flat design, circle background. Minimalist features. NO TEXT. Aspect ratio 1:1.`
        }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Error generating character image:", error);
    return null;
  }
};

export const generateItemImage = async (itemDescription: string): Promise<string | null> => {
  const client = getClient();
  if (!client) return null;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{
          text: `Create a simple, clean vector art icon or illustration of: ${itemDescription}. Digital flat design style, white background, minimalist. Purely visual object. NO TEXT. Aspect ratio 1:1.`
        }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Error generating item image:", error);
    return null;
  }
};
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

export const generateSceneImage = async (sceneDescription: string): Promise<string | null> => {
  const client = getClient();
  if (!client) return null;

  try {
    const response = await client.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `STRICTLY NO TEXT. NO WORDS. NO LETTERS. NO SIGNS. NO LABELS. NO SPEECH BUBBLES. NO SPLIT SCREEN. NO COLLAGE. ONE UNIFIED SCENE. A clean, text-free vector art illustration in digital city style, flat design, modern colors. The scene depicts: ${sceneDescription}. The image must be purely visual with absolutely no written language or symbols representing text.`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '16:9',
      },
    });

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64ImageBytes) {
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};

export const generateCharacterImage = async (characterName: string, mood: string = 'neutral'): Promise<string | null> => {
  const client = getClient();
  if (!client) return null;

  try {
    const response = await client.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `STRICTLY NO TEXT. NO WORDS. NO LETTERS. NO NAME TAGS. Vector art avatar portrait of a character named "${characterName}", looking ${mood}. Digital city style, flat design, circle background. Minimalist features. Purely visual character design.`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64ImageBytes) {
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    return null;
  } catch (error) {
    console.error("Error generating character image:", error);
    return null;
  }
};
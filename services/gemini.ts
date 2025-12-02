import { GoogleGenAI, Type } from "@google/genai";
import { DirectorPlan } from "../types";

const CACHE_KEY = 'gemini-api-key';

export const setApiKey = (key: string) => {
  localStorage.setItem(CACHE_KEY, key);
};

// Helper to get client with current key
const getClient = () => {
  const cachedKey = localStorage.getItem(CACHE_KEY);
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  const finalKey = cachedKey || envKey || '';
  return new GoogleGenAI({ apiKey: finalKey });
};

export const checkApiKey = async (): Promise<boolean> => {
  return !!localStorage.getItem(CACHE_KEY);
};

export const requestApiKey = async (): Promise<boolean> => {
  const win = window as any;
  if (win.aistudio && win.aistudio.openSelectKey) {
    await win.aistudio.openSelectKey();
    return await win.aistudio.hasSelectedApiKey();
  }
  return false;
};

// Force a reset of the key
export const clearApiKey = async (): Promise<void> => {
  localStorage.removeItem(CACHE_KEY);
};

export const directorAgent = async (brief: string): Promise<DirectorPlan> => {
  const ai = getClient();
  const systemInstruction = `
    You are the Director of a high-end creative studio.
    Your goal is to decompose a user's abstract brief into precise technical instructions for two departments:
    1. The Art Department (creates the static image).
    2. The Motion Department (animates the image).
    
    Output a JSON object with:
    - visualPrompt: A highly detailed, photorealistic prompt for an image generation model (Imagen 4.0). Focus on lighting, composition, texture, and style.
    - motionPrompt: A specific instruction for a video generation model (Veo) to animate the image. Focus on camera movement, subject movement, and physics.
    - reasoning: A brief explanation of your creative direction.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: brief,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          visualPrompt: { type: Type.STRING },
          motionPrompt: { type: Type.STRING },
          reasoning: { type: Type.STRING },
        },
        required: ['visualPrompt', 'motionPrompt', 'reasoning']
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Director failed to generate a plan.");
  
  return JSON.parse(text) as DirectorPlan;
};

export const artDeptAgent = async (prompt: string): Promise<string> => {
  const ai = getClient();
  // Using Imagen 4.0 as requested
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: '16:9',
      outputMimeType: 'image/jpeg'
    }
  });

  const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
  if (!imageBytes) throw new Error("Art Dept failed to generate image.");
  
  return imageBytes; // Base64 string
};

export const motionDeptAgent = async (imageBytes: string, prompt: string): Promise<string> => {
  const ai = getClient();
  
  // Veo 3.1 Fast for video generation
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    image: {
      imageBytes: imageBytes,
      mimeType: 'image/jpeg',
    },
    config: {
      numberOfVideos: 1,
      aspectRatio: '16:9'
    }
  });

  // Poll for completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!uri) throw new Error("Motion Dept failed to generate video.");
  
  return uri;
};

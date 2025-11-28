import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

let chatSession: Chat | null = null;

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const initializeChat = (): void => {
  const ai = getAiClient();
  if (!ai) return;

  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!chatSession) {
    initializeChat();
  }

  if (!chatSession) {
    return "Desculpe, o serviço de chat não está disponível no momento (API Key ausente).";
  }

  try {
    const response: GenerateContentResponse = await chatSession.sendMessage({ message });
    return response.text || "Não consegui processar sua resposta.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ocorreu um erro ao processar sua mensagem. Tente novamente ou contacte o suporte via WhatsApp.";
  }
};

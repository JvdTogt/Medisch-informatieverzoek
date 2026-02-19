
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { FileData } from "../types";

/**
 * Verwerkt medische informatie en anonimiseert deze.
 */
export const processMedicalData = async (
  requestInput: { text: string; file?: FileData },
  journalText: string,
  specialistText: string,
  specialistFile?: FileData
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    throw new Error("AUTH_REQUIRED");
  }

  // Maak telkens een nieuwe instantie aan om de meest actuele sleutel te gebruiken
  const genAI = new GoogleGenAI({ apiKey });
  
  const parts: Part[] = [];

  const systemInstruction = `
    Je bent een deskundige medisch administratief medewerker. 
    Je taak is het opstellen van een officiële brief met de titel "Medisch informatieverzoek".
    
    RICHTLIJNEN:
    1. ANONIMISERING: Scan alle data op privacygevoelige informatie. Vervang namen door [NAAM], BSN door [BSN], etc.
    2. STRUCTUUR: Titel gecentreerd bovenaan. Professionele toon. Max 1.5 A4.
    3. BRONNEN: Gebruik de verstrekte bronnen voor een complete samenvatting en verzoek.
    
    Genereer alleen de tekst van de brief in het Nederlands.
  `;

  let prompt = "Stel een medisch informatieverzoek op op basis van deze bronnen:\n\n";

  if (requestInput.text) prompt += `Bron 1: ${requestInput.text}\n`;
  if (requestInput.file) {
    parts.push({
      inlineData: {
        data: requestInput.file.base64,
        mimeType: requestInput.file.mimeType
      }
    });
    prompt += "(Zie bijlage Bron 1)\n";
  }

  prompt += `\nBron 2: ${journalText}\n`;
  prompt += `\nBron 3: ${specialistText}\n`;

  if (specialistFile) {
    parts.push({
      inlineData: {
        data: specialistFile.base64,
        mimeType: specialistFile.mimeType
      }
    });
    prompt += "\nBron 4: (Zie bijlage Bron 4)\n";
  }

  parts.push({ text: prompt });

  try {
    const response: GenerateContentResponse = await genAI.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    return response.text || "Geen resultaat.";
  } catch (error: any) {
    if (error.message?.includes("API key not found") || error.message?.includes("Requested entity was not found")) {
      throw new Error("AUTH_REQUIRED");
    }
    throw error;
  }
};

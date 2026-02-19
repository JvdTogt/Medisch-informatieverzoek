
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { FileData } from "../types";

/**
 * Verwerkt medische informatie en anonimiseert deze.
 */
export const processMedicalData = async (
  requestInput: { text: string; file?: FileData },
  journalText: string,
  specialistText: string,
  specialistFile?: FileData,
  extraContext?: string
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  // Geen geforceerde AUTH_REQUIRED check hier, we laten de AI call de fout bepalen
  const genAI = new GoogleGenAI({ apiKey: apiKey || '' });
  
  const parts: Part[] = [];

  const systemInstruction = `
    Je bent een deskundige medisch administratief medewerker. 
    Je taak is het opstellen van een officiële brief met de titel "MEDISCH INFORMATIEVERZOEK".
    
    RICHTLIJNEN:
    1. ANONIMISERING: Vervang ALLE privacygevoelige gegevens (namen, BSN, geboortedata, adressen van patiënten) door [GEANONIMISEERD].
    2. STRUCTUUR: Professionele briefindeling in het Nederlands. Gebruik een zakelijke toon.
    3. FORMATTERING: Geen asterisken (*) of hashtags (#). Enkel platte tekst met witregels.
    4. INHOUD: Gebruik alle bronnen om een compleet antwoord te formuleren op het verzoek.
  `;

  let prompt = "Stel een medisch informatieverzoek op op basis van deze 4 bronnen:\n\n";

  if (requestInput.text) prompt += `Bron 1 (Aanvraag): ${requestInput.text}\n`;
  if (requestInput.file) {
    parts.push({
      inlineData: {
        data: requestInput.file.base64,
        mimeType: requestInput.file.mimeType
      }
    });
    prompt += "(Analyseer Bron 1 uit bijlage)\n";
  }

  prompt += `\nBron 2 (Journaal): ${journalText}\n`;
  prompt += `\nBron 3 (Specialist Tekst): ${specialistText}\n`;

  if (specialistFile) {
    parts.push({
      inlineData: {
        data: specialistFile.base64,
        mimeType: specialistFile.mimeType
      }
    });
    prompt += "(Analyseer Bron 3 uit bijlage)\n";
  }

  if (extraContext) {
    prompt += `\nBron 4 (Extra Context/Medicatie): ${extraContext}\n`;
  }

  parts.push({ text: prompt });

  try {
    const response: GenerateContentResponse = await genAI.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.1,
      },
    });

    return response.text || "Fout: Geen tekst gegenereerd.";
  } catch (error: any) {
    const errorMsg = error.message || "";
    throw new Error(errorMsg);
  }
};


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

  const genAI = new GoogleGenAI({ apiKey });
  
  const parts: Part[] = [];

  const systemInstruction = `
    Je bent een deskundige medisch administratief medewerker. 
    Je taak is het opstellen van een officiële brief met de titel "MEDISCH INFORMATIEVERZOEK".
    
    RICHTLIJNEN:
    1. ANONIMISERING: Vervang ALLE privacygevoelige gegevens (namen, BSN, geboortedata, adressen van patiënten) door [GEANONIMISEERD].
    2. STRUCTUUR: Professionele briefindeling in het Nederlands. Gebruik een zakelijke toon.
    3. FORMATTERING: Gebruik GEEN asterisken (*) of hashtags (#) voor opmaak. Lever enkel platte tekst met duidelijke witregels tussen paragrafen.
    4. INHOUD: Vat de medische context uit de verstrekte bronnen (journaalregels, brieven) samen om de vraag van de externe partij te beantwoorden.
    
    Belangrijk: Genereer enkel de tekst van de brief, klaar voor gebruik in een Word-document.
  `;

  let prompt = "Stel een medisch informatieverzoek op op basis van de volgende bronnen:\n\n";

  if (requestInput.text) prompt += `Bron 1 (Aanvraag): ${requestInput.text}\n`;
  if (requestInput.file) {
    parts.push({
      inlineData: {
        data: requestInput.file.base64,
        mimeType: requestInput.file.mimeType
      }
    });
    prompt += "(Analyseer bijgevoegde scan van Bron 1)\n";
  }

  prompt += `\nBron 2 (HIS Journaal): ${journalText}\n`;
  prompt += `\nBron 3 (Specialist brieftekst): ${specialistText}\n`;

  if (specialistFile) {
    parts.push({
      inlineData: {
        data: specialistFile.base64,
        mimeType: specialistFile.mimeType
      }
    });
    prompt += "\nBron 4 (Specialist bijlage): (Analyseer dit document mee)\n";
  }

  parts.push({ text: prompt });

  try {
    const response: GenerateContentResponse = await genAI.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.15,
      },
    });

    if (!response.text) {
      throw new Error("Geen resultaat ontvangen van de AI.");
    }

    return response.text;
  } catch (error: any) {
    const errorMsg = error.message || "";
    if (errorMsg.includes("API key not found") || 
        errorMsg.includes("Requested entity was not found") ||
        errorMsg.includes("403") ||
        errorMsg.includes("401")) {
      throw new Error("AUTH_REQUIRED");
    }
    throw new Error("AI-fout: " + errorMsg);
  }
};

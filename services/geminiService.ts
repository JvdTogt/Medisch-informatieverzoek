
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
  
  if (!apiKey || apiKey === 'undefined') {
    throw new Error("API-sleutel niet gevonden. Controleer de omgevingsvariabelen.");
  }

  // Initialisatie pas bij aanroep
  const genAI = new GoogleGenAI({ apiKey });
  
  const parts: Part[] = [];

  const systemInstruction = `
    Je bent een deskundige medisch administratief medewerker. 
    Je taak is het opstellen van een officiële brief met de titel "Medisch informatieverzoek".
    
    RICHTLIJNEN:
    1. ANONIMISERING: Scan alle input data op privacygevoelige informatie. Je MOET de volgende gegevens ALTIJD vervangen door placeholders:
       - Namen van patiënten -> [NAAM]
       - Burgerservicenummers (BSN) -> [BSN]
       - Geboortedatums -> [GEBOORTEDATUM]
       - Adressen en telefoonnummers -> [ADRES] / [TELEFOONNUMMER]
    
    2. STRUCTUUR:
       - Titel: "Medisch informatieverzoek" (Bovenaan gecentreerd).
       - Inhoud: Een heldere samenvatting en verzoek gebaseerd op de 4 verstrekte inputbronnen.
       - Lengte: Maximaal 1.5 A4 pagina's aan tekst.
       - Toon: Professioneel en zakelijk Nederlands.
    
    Genereer alleen de tekst voor de brief.
  `;

  let prompt = "Stel een medisch informatieverzoek op basis van:\n\n";

  if (requestInput.text) prompt += `BRON 1: ${requestInput.text}\n`;
  if (requestInput.file) {
    parts.push({
      inlineData: {
        data: requestInput.file.base64,
        mimeType: requestInput.file.mimeType
      }
    });
    prompt += "(Zie bijlage 1)\n";
  }

  prompt += `\nBRON 2: ${journalText}\n`;
  prompt += `\nBRON 3: ${specialistText}\n`;

  if (specialistFile) {
    parts.push({
      inlineData: {
        data: specialistFile.base64,
        mimeType: specialistFile.mimeType
      }
    });
    prompt += "\nBRON 4: (Zie bijlage 4)\n";
  }

  parts.push({ text: prompt });

  const response: GenerateContentResponse = await genAI.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      systemInstruction,
      temperature: 0.2,
    },
  });

  return response.text || "Geen resultaat gegenereerd.";
};

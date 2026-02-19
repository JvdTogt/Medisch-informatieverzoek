
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
  // Initialiseer binnen de functie om fouten bij het laden van de pagina te voorkomen
  // als de API-sleutel nog niet direct beschikbaar is in de omgeving.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
       - Lengte: Maximaal 1.5 A4 pagina's aan tekst (ongeveer 800-1000 woorden).
       - Toon: Professioneel, zakelijk en medisch correct Nederlands.
    
    3. INPUT BRONNEN:
       - Bron 1: Het informatieverzoek zelf (kan tekst of afbeelding zijn).
       - Bron 2: Journaalregels uit een HIS (Huisarts Informatie Systeem).
       - Bron 3: Tekst uit een specialistenbrief.
       - Bron 4: Geüpload document van een specialist.
    
    Genereer alleen de tekst voor de brief, beginnend bij de titel.
  `;

  let prompt = "Stel een medisch informatieverzoek op basis van de volgende gegevens:\n\n";

  prompt += "BRON 1 (Informatieverzoek):\n";
  if (requestInput.text) prompt += `Tekst: ${requestInput.text}\n`;
  if (requestInput.file) {
    parts.push({
      inlineData: {
        data: requestInput.file.base64,
        mimeType: requestInput.file.mimeType
      }
    });
    prompt += "(Zie bijgevoegde afbeelding/PDF voor Bron 1)\n";
  }

  prompt += `\nBRON 2 (Journaalregels):\n${journalText}\n`;
  prompt += `\nBRON 3 (Specialistenbrief tekst):\n${specialistText}\n`;

  if (specialistFile) {
    parts.push({
      inlineData: {
        data: specialistFile.base64,
        mimeType: specialistFile.mimeType
      }
    });
    prompt += "\nBRON 4 (Specialistenbrief bestand): (Zie bijgevoegde afbeelding/PDF/Document voor Bron 4)\n";
  }

  parts.push({ text: prompt });

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.3,
    },
  });

  return response.text || "Fout bij het genereren van de tekst.";
};

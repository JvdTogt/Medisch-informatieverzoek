
export interface ProcessingResult {
  anonymizedJournal: string;
  anonymizedSpecialistLetters: string;
  extractedRequest: string;
  generatedLetter: string;
}

export interface AppState {
  journalText: string;
  specialistLettersText: string;
  requestFileData: string | null;
  requestFileType: string | null;
  specialistImage: string | null;
  isProcessing: boolean;
  result: ProcessingResult | null;
  error: string | null;
}

export enum Step {
  INPUT = 'INPUT',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT'
}

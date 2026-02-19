
export interface FileData {
  base64: string;
  mimeType: string;
  name: string;
}

export interface ProcessingState {
  status: 'idle' | 'processing' | 'success' | 'error';
  message?: string;
}

export interface GeneratedContent {
  title: string;
  body: string;
}

// Toegevoegd op basis van build error logs
export type Step = 'input' | 'processing' | 'result';

export interface AppState {
  step: Step;
  requestText: string;
  journalText: string;
  specialistText: string;
  result: string | null;
}

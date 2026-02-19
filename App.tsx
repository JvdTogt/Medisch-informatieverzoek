
import React, { useState } from 'react';
import { processMedicalData } from './services/geminiService';
import { downloadAsWord } from './services/wordService';
import { FileData, ProcessingState } from './types';
import { 
  FileText, 
  Upload, 
  ClipboardList, 
  Stethoscope, 
  FileSearch, 
  Download, 
  RefreshCcw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  Key
} from 'lucide-react';
import InputSection from './components/InputSection';
import { fileToBase64, getMimeType } from './utils';

const App: React.FC = () => {
  const [requestText, setRequestText] = useState('');
  const [requestFile, setRequestFile] = useState<FileData | undefined>();
  const [journalText, setJournalText] = useState('');
  const [specialistText, setSpecialistText] = useState('');
  const [specialistFile, setSpecialistFile] = useState<FileData | undefined>();

  const [processing, setProcessing] = useState<ProcessingState>({ status: 'idle' });
  const [result, setResult] = useState<string | null>(null);

  /**
   * Opent de sleutel-selectie en probeert daarna direct te genereren.
   */
  const handleSetKey = async () => {
    try {
      // @ts-ignore
      if (window.aistudio) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        // Na selectie proberen we direct opnieuw
        setProcessing({ status: 'processing', message: 'Sleutel geselecteerd, brief genereren...' });
        setTimeout(() => handleGenerate(), 300); 
      }
    } catch (err) {
      console.error("Fout bij openen key selector:", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (data: FileData) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setter({
          base64,
          mimeType: getMimeType(file),
          name: file.name
        });
      } catch (err) {
        console.error("Upload fout:", err);
      }
    }
  };

  const handleGenerate = async () => {
    if (!requestText && !requestFile && !journalText && !specialistText && !specialistFile) {
      setProcessing({ status: 'error', message: 'Vul minimaal één bron in.' });
      return;
    }

    // Proactieve check op sleutel aanwezigheid
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey && (!process.env.API_KEY || process.env.API_KEY === 'undefined' || process.env.API_KEY === '')) {
        setProcessing({ status: 'error', message: 'Geen API-sleutel geselecteerd.' });
        await handleSetKey();
        return;
      }
    }

    setProcessing({ status: 'processing', message: 'Bezig met anonimiseren en opstellen...' });
    setResult(null);

    try {
      const generatedText = await processMedicalData(
        { text: requestText, file: requestFile },
        journalText,
        specialistText,
        specialistFile
      );
      setResult(generatedText);
      setProcessing({ status: 'success' });
    } catch (err: any) {
      if (err.message === "AUTH_REQUIRED") {
        setProcessing({ 
          status: 'error', 
          message: 'Geldige API-sleutel (BETAALD PROJECT) vereist voor Gemini 3 Pro.' 
        });
      } else {
        setProcessing({ 
          status: 'error', 
          message: err.message || 'Onverwachte fout bij genereren.' 
        });
      }
    }
  };

  const resetForm = () => {
    setRequestText('');
    setRequestFile(undefined);
    setJournalText('');
    setSpecialistText('');
    setSpecialistFile(undefined);
    setResult(null);
    setProcessing({ status: 'idle' });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-blue-100 rounded-3xl mb-6">
          <FileSearch className="w-10 h-10 text-blue-600" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">AI tool voor verwerking medische informatieverzoeken</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Genereer professionele, geanonimiseerde brieven op basis van diverse medische bronnen.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <InputSection 
          title="1. Informatieverzoek" 
          description="Inhoud van de aanvraag (tekst of scan)."
          icon={<FileText className="w-5 h-5" />}
        >
          <textarea
            className="w-full h-32 p-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none mb-4"
            placeholder="Plak hier het verzoek..."
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <input type="file" id="req-file" className="hidden" onChange={(e) => handleFileUpload(e, setRequestFile)} />
            <label htmlFor="req-file" className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm">
              <Upload className="w-4 h-4 text-blue-500" />
              {requestFile ? <span className="truncate max-w-[150px]">{requestFile.name}</span> : "Scan toevoegen"}
            </label>
            {requestFile && <button onClick={() => setRequestFile(undefined)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
          </div>
        </InputSection>

        <InputSection 
          title="2. Journaalregels" 
          description="Plak relevante regels uit het HIS."
          icon={<ClipboardList className="w-5 h-5" />}
        >
          <textarea
            className="w-full h-48 p-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none"
            placeholder="Plak journaalregels..."
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
          />
        </InputSection>

        <InputSection 
          title="3. Brieftekst Specialist" 
          description="Kopie van tekst uit een eerdere brief."
          icon={<Stethoscope className="w-5 h-5" />}
        >
          <textarea
            className="w-full h-48 p-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none"
            placeholder="Brieftekst..."
            value={specialistText}
            onChange={(e) => setSpecialistText(e.target.value)}
          />
        </InputSection>

        <InputSection 
          title="4. Brief (Document)" 
          description="Upload volledige brief (PDF of Word)."
          icon={<Upload className="w-5 h-5" />}
        >
          <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 p-6 group hover:border-blue-400 transition-colors">
             <input type="file" id="spec-file" className="hidden" onChange={(e) => handleFileUpload(e, setSpecialistFile)} />
             <label htmlFor="spec-file" className="flex flex-col items-center gap-3 cursor-pointer">
                <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform border border-slate-100">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-slate-600 text-center max-w-[200px] truncate">
                  {specialistFile ? specialistFile.name : "Kies document"}
                </span>
             </label>
             {specialistFile && <button onClick={() => setSpecialistFile(undefined)} className="mt-4 text-xs text-red-500 hover:underline font-medium">Verwijder bestand</button>}
          </div>
        </InputSection>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-4xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-50">
        <div className="flex items-center gap-3">
          {processing.status === 'processing' ? (
            <div className="flex items-center gap-2 text-blue-600 font-bold">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{processing.message}</span>
            </div>
          ) : processing.status === 'error' ? (
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{processing.message}</span>
            </div>
          ) : result ? (
            <div className="flex items-center gap-2 text-green-600 font-bold">
              <CheckCircle2 className="w-5 h-5" />
              <span>Gereed voor export</span>
            </div>
          ) : <span className="text-slate-400 text-sm italic">Voer data in...</span>}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {processing.status === 'error' && (
            <button 
              onClick={handleSetKey} 
              className="px-4 py-2 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all flex items-center gap-2 shadow-lg shadow-amber-200"
            >
              <Key className="w-4 h-4" /> Sleutel Instellen
            </button>
          )}
          <button 
            onClick={resetForm} 
            className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 border border-slate-200"
          >
            <RefreshCcw className="w-4 h-4" /> Reset
          </button>
          <button 
            onClick={handleGenerate} 
            disabled={processing.status === 'processing'} 
            className="flex-1 sm:flex-none px-8 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-200 transition-all"
          >
            Genereer Brief
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-16 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mb-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-400" />
              Gegenereerde Brief
            </h2>
            <button 
              onClick={() => downloadAsWord("Medisch Informatieverzoek", result)} 
              className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-900/20 active:scale-95"
            >
              <Download className="w-5 h-5" /> Download als Word
            </button>
          </div>
          <div className="p-8 md:p-16 bg-slate-50/30">
            <div className="bg-white p-10 md:p-16 border border-slate-100 rounded-2xl shadow-inner min-h-[600px] whitespace-pre-wrap font-serif text-lg leading-relaxed text-slate-800 selection:bg-blue-100">
              {result}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

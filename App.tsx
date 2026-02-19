
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
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  FilePlus2,
  Sparkles,
  ArrowRight,
  MessageSquarePlus
} from 'lucide-react';
import InputSection from './components/InputSection';
import { fileToBase64, getMimeType } from './utils';

const App: React.FC = () => {
  const [requestText, setRequestText] = useState('');
  const [requestFile, setRequestFile] = useState<FileData | undefined>();
  const [journalText, setJournalText] = useState('');
  const [specialistText, setSpecialistText] = useState('');
  const [specialistFile, setSpecialistFile] = useState<FileData | undefined>();
  const [extraContext, setExtraContext] = useState('');

  const [processing, setProcessing] = useState<ProcessingState>({ status: 'idle' });
  const [result, setResult] = useState<string | null>(null);

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
    if (!requestText && !requestFile && !journalText && !specialistText && !specialistFile && !extraContext) {
      setProcessing({ status: 'error', message: 'Geen gegevens om te verwerken.' });
      return;
    }

    setProcessing({ status: 'processing', message: 'AI analyseert bronnen...' });
    setResult(null);

    try {
      const generatedText = await processMedicalData(
        { text: requestText, file: requestFile },
        journalText,
        specialistText,
        specialistFile,
        extraContext
      );
      setResult(generatedText);
      setProcessing({ status: 'success' });
    } catch (err: any) {
      const errorMsg = err.message || '';
      
      if (errorMsg.includes("Requested entity was not found")) {
        setProcessing({ 
          status: 'error', 
          message: 'Toegang geweigerd. Controleer of de API-configuratie correct is.' 
        });
      } else {
        setProcessing({ 
          status: 'error', 
          message: 'Er is een fout opgetreden bij het verwerken.' 
        });
      }
      console.error("AI Error:", err);
    }
  };

  const resetForm = () => {
    setRequestText('');
    setRequestFile(undefined);
    setJournalText('');
    setSpecialistText('');
    setSpecialistFile(undefined);
    setExtraContext('');
    setResult(null);
    setProcessing({ status: 'idle' });
  };

  return (
    <div className="min-h-screen selection:bg-medical-100 selection:text-medical-900 pb-48">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-24">
        
        {/* Header Section */}
        <header className="relative text-center mb-24 animate-in fade-in slide-in-from-top-6 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-medical-50 rounded-full border border-medical-100 text-medical-700 text-sm font-bold mb-8 shadow-sm">
            <Sparkles className="w-4 h-4" />
            <span>Smart Medical Assistant</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-[900] text-slate-900 tracking-tight mb-6 leading-[1.15]">
            AI tool voor verwerking <br className="hidden md:block" /> 
            <span className="text-medical-600 italic">medische informatieverzoeken</span>
          </h1>
          <p className="text-slate-500 text-xl max-w-2xl mx-auto leading-relaxed font-medium">
            Verwerk geanonimiseerd medische informatie ten behoeve van medische informatieverzoeken. Veilig, betrouwbaar en snel.
          </p>
        </header>

        {/* Vertical Layout - Step by Step */}
        <div className="space-y-12">
          
          {/* 1. Upload informatieverzoek */}
          <InputSection 
            step={1}
            title="Upload informatieverzoek" 
            description="" 
            icon={<FileText className="w-6 h-6" />}
          >
            <div className="space-y-4">
              <textarea
                className="w-full h-36 p-5 text-base bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-medical-500/10 focus:border-medical-500 focus:bg-white transition-all outline-none resize-none input-focus placeholder:text-slate-300 font-medium"
                placeholder="Plak hier de tekst van de inkomende aanvraag..."
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
              />
              <div className="flex items-center gap-4">
                <input type="file" id="req-file" className="hidden" onChange={(e) => handleFileUpload(e, setRequestFile)} />
                <label htmlFor="req-file" className="flex-1 flex items-center justify-center gap-3 py-4 px-6 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-medical-400 hover:bg-medical-50 transition-all text-sm font-bold text-slate-700 shadow-sm">
                  <Upload className="w-5 h-5 text-medical-600" />
                  {requestFile ? <span className="truncate max-w-[300px]">{requestFile.name}</span> : "Scan of PDF bijvoegen"}
                </label>
                {requestFile && (
                  <button onClick={() => setRequestFile(undefined)} className="p-4 text-red-500 bg-red-50 hover:bg-red-100 rounded-2xl transition-all hover:scale-105">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </InputSection>

          {/* 2. Invoer journaalregels */}
          <InputSection 
            step={2}
            title="Invoer journaalregels" 
            description="Kopieer de relevante passages uit het HIS journaal."
            icon={<ClipboardList className="w-6 h-6" />}
          >
            <textarea
              className="w-full h-56 p-5 text-base bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-medical-500/10 focus:border-medical-500 focus:bg-white transition-all outline-none resize-none input-focus placeholder:text-slate-300 font-medium"
              placeholder="Plak hier de journaalregels..."
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
            />
          </InputSection>

          {/* 3. Specialistische informatie */}
          <InputSection 
            step={3}
            title="Specialistische informatie" 
            description="Brieven, uitslagen of screenshots van specialisten."
            icon={<Stethoscope className="w-6 h-6" />}
          >
            <div className="grid grid-cols-1 gap-6">
              <textarea
                className="w-full h-44 p-5 text-base bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-medical-500/10 focus:border-medical-500 focus:bg-white transition-all outline-none resize-none input-focus placeholder:text-slate-300 font-medium"
                placeholder="Plak tekst uit specialistische correspondentie..."
                value={specialistText}
                onChange={(e) => setSpecialistText(e.target.value)}
              />
              <div className="relative">
                <input type="file" id="spec-file" className="hidden" onChange={(e) => handleFileUpload(e, setSpecialistFile)} />
                <label htmlFor="spec-file" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 p-8 cursor-pointer hover:border-medical-400 hover:bg-medical-50 transition-all">
                  <FilePlus2 className="w-8 h-8 text-medical-600 mb-2" />
                  <span className="font-bold text-slate-700">{specialistFile ? specialistFile.name : "Bijlage toevoegen"}</span>
                </label>
                {specialistFile && (
                  <button onClick={() => setSpecialistFile(undefined)} className="absolute top-4 right-4 p-2 text-red-500 bg-white rounded-xl shadow-sm border border-slate-100">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </InputSection>

          {/* 4. Aanvullende context */}
          <InputSection 
            step={4}
            title="Aanvullende context" 
            description="Extra informatie, zoals medicatie-overzichten of specifieke wensen."
            icon={<MessageSquarePlus className="w-6 h-6" />}
          >
            <textarea
              className="w-full h-32 p-5 text-base bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-medical-500/10 focus:border-medical-500 focus:bg-white transition-all outline-none resize-none input-focus placeholder:text-slate-300 font-medium"
              placeholder="Voeg hier overige relevante informatie toe..."
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
            />
          </InputSection>
        </div>

        {/* Sticky Action Bar */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-4xl z-50">
          <div className="glass shadow-2xl rounded-[2.5rem] p-4 flex flex-col md:flex-row items-center justify-between gap-4 ring-1 ring-white/40">
            <div className="flex items-center gap-4 px-4">
              {processing.status === 'processing' ? (
                <div className="flex items-center gap-3 text-medical-700">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-bold text-sm">Bezig met verwerken...</span>
                </div>
              ) : processing.status === 'error' ? (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="font-bold text-xs max-w-[200px] leading-tight">{processing.message}</span>
                </div>
              ) : result ? (
                <div className="flex items-center gap-3 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-bold text-sm">Gereed</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-slate-400">
                  <FileSearch className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">Wachten op invoer</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={resetForm} 
                className="px-8 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
              >
                Reset
              </button>
              <button 
                onClick={handleGenerate} 
                disabled={processing.status === 'processing'} 
                className="flex-1 md:flex-none px-12 py-4 bg-medical-600 text-white font-black rounded-2xl hover:bg-medical-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-xl shadow-medical-500/20 active:scale-95"
              >
                Start Verwerking
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Result Area */}
        {result && (
          <div className="mt-32 mb-40 animate-in fade-in slide-in-from-bottom-16 duration-1000 fill-mode-both">
            <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 overflow-hidden">
              <div className="bg-slate-900 text-white p-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-medical-500 rounded-2xl flex items-center justify-center">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-[900]">Concept Brief</h2>
                </div>
                <button 
                  onClick={() => downloadAsWord("Medisch_Informatieverzoek", result)} 
                  className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Download className="w-5 h-5" /> Exporteer Word
                </button>
              </div>
              <div className="p-10 md:p-20 bg-slate-50/30">
                <div className="bg-white p-10 md:p-16 border border-slate-100 rounded-[2.5rem] min-h-[600px] whitespace-pre-wrap font-serif text-lg leading-relaxed text-slate-800">
                  {result}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

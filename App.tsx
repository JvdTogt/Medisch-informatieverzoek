
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
  Key,
  FilePlus2,
  Sparkles,
  ArrowRight
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

  const handleSetKey = async () => {
    // @ts-ignore
    if (window.aistudio) {
      try {
        setProcessing({ status: 'processing', message: 'Sleutelvenster openen...' });
        // @ts-ignore
        await window.aistudio.openSelectKey();
        // Na het aanroepen gaan we ervan uit dat de gebruiker actie onderneemt.
        // We proberen direct te genereren (race condition handling)
        handleGenerate();
      } catch (err) {
        console.error("Fout bij openen key selector:", err);
        setProcessing({ status: 'error', message: 'Kon het sleutelvenster niet openen.' });
      }
    } else {
      setProcessing({ 
        status: 'error', 
        message: 'Platform integratie ontbreekt. Gebruik de knop in AI Studio of stel een API_KEY in.' 
      });
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
      setProcessing({ status: 'error', message: 'Geen gegevens om te verwerken.' });
      return;
    }

    // Controleer of er een sleutel is, anders open selector
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey && (!process.env.API_KEY || process.env.API_KEY === 'undefined' || process.env.API_KEY === '')) {
        await handleSetKey();
        return;
      }
    }

    setProcessing({ status: 'processing', message: 'AI analyseert bronnen...' });
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
      const errorMsg = err.message || '';
      
      // Specifieke afhandeling voor "Requested entity was not found" -> opnieuw sleutel vragen
      if (errorMsg.includes("Requested entity was not found")) {
        setProcessing({ 
          status: 'error', 
          message: 'Geselecteerde project/sleutel heeft geen toegang. Kies een betaald project.' 
        });
        // @ts-ignore
        if (window.aistudio) {
          // Forceer opnieuw openen van de selector
          // @ts-ignore
          window.aistudio.openSelectKey();
        }
      } else if (errorMsg === "AUTH_REQUIRED") {
        setProcessing({ 
          status: 'error', 
          message: 'Project autorisatie vereist (Premium API).' 
        });
      } else {
        setProcessing({ 
          status: 'error', 
          message: errorMsg || 'Verwerkingsfout.' 
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
            Verwerk geanonimiseerd medische informatie ten behoeve van medische informatieverzoeken. <br />
            Veilig, betrouwbaar en snel.
          </p>
        </header>

        {/* Vertical Layout - Step by Step */}
        <div className="space-y-12">
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

          <InputSection 
            step={3}
            title="Specialistische informatie" 
            description="Brieven, uitslagen of screenshots van specialisten."
            icon={<Stethoscope className="w-6 h-6" />}
          >
            <div className="grid grid-cols-1 gap-6">
              <div className="flex flex-col">
                <textarea
                  className="w-full h-44 p-5 text-base bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-medical-500/10 focus:border-medical-500 focus:bg-white transition-all outline-none resize-none input-focus placeholder:text-slate-300 font-medium"
                  placeholder="Plak tekst uit specialistische correspondentie..."
                  value={specialistText}
                  onChange={(e) => setSpecialistText(e.target.value)}
                />
              </div>
              <div className="relative group/upload">
                <input type="file" id="spec-file" className="hidden" onChange={(e) => handleFileUpload(e, setSpecialistFile)} />
                <label htmlFor="spec-file" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 p-10 cursor-pointer group-hover/upload:border-medical-400 group-hover/upload:bg-medical-50 transition-all duration-500">
                  <div className="p-5 bg-white rounded-2xl shadow-sm group-hover/upload:scale-110 group-hover/upload:shadow-md transition-all duration-500 border border-slate-100">
                    <FilePlus2 className="w-8 h-8 text-medical-600" />
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-lg font-bold text-slate-800">
                      {specialistFile ? specialistFile.name : "Sleep hier uw bestand of klik"}
                    </p>
                    <p className="text-sm text-slate-400 mt-2 font-medium">Ondersteunt PDF, Word, JPG, PNG</p>
                  </div>
                </label>
                {specialistFile && (
                  <button 
                    onClick={() => setSpecialistFile(undefined)} 
                    className="absolute top-6 right-6 p-3 bg-white text-red-500 hover:text-red-700 rounded-2xl shadow-md border border-slate-100 transition-all hover:scale-110 active:scale-90"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </InputSection>
        </div>

        {/* Sticky Action Bar */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-4xl z-50 animate-in slide-in-from-bottom-12 duration-700 delay-300 fill-mode-both">
          <div className="glass shadow-[0_32px_64px_rgba(0,0,0,0.12)] rounded-[2.5rem] p-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 ring-1 ring-white/40">
            <div className="flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/40">
              {processing.status === 'processing' ? (
                <div className="flex items-center gap-3 text-medical-700">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-bold text-sm tracking-tight">{processing.message}</span>
                </div>
              ) : processing.status === 'error' ? (
                <div className="flex items-center gap-3 text-red-600">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="font-bold text-xs md:text-sm leading-tight max-w-[150px] md:max-w-xs">{processing.message}</span>
                </div>
              ) : result ? (
                <div className="flex items-center gap-3 text-emerald-600">
                  <div className="bg-emerald-500/10 p-1.5 rounded-lg">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm">Gereed voor controle</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-slate-400">
                  <FileSearch className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Klaar voor verwerking</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={handleSetKey} 
                className="px-6 py-4 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-600 transition-all flex items-center gap-2 shadow-xl shadow-amber-200 active:scale-95"
              >
                <Key className="w-4 h-4" /> Sleutel
              </button>
              <button 
                onClick={resetForm} 
                className="px-8 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
              >
                Reset
              </button>
              <button 
                onClick={handleGenerate} 
                disabled={processing.status === 'processing'} 
                className="flex-1 md:flex-none px-12 py-4 bg-medical-600 text-white font-black rounded-2xl hover:bg-medical-700 disabled:opacity-50 shadow-2xl shadow-medical-500/30 transition-all flex items-center justify-center gap-3 transform hover:-translate-y-1 active:translate-y-0 active:scale-95 group"
              >
                Start AI Verwerking
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Result Area */}
        {result && (
          <div className="mt-32 mb-40 animate-in fade-in slide-in-from-bottom-16 duration-1000 fill-mode-both">
            <div className="bg-white rounded-[3.5rem] shadow-[0_40px_100px_rgba(15,23,42,0.08)] border border-slate-100 overflow-hidden">
              <div className="bg-slate-900 text-white p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-medical-500 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-medical-500/40">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-[900] tracking-tight">Concept Brief</h2>
                    <p className="text-slate-400 text-base font-medium mt-1">AI-geanonimiseerd & Gestructureerd</p>
                  </div>
                </div>
                <button 
                  onClick={() => downloadAsWord("Medisch_Informatieverzoek", result)} 
                  className="w-full md:w-auto flex items-center justify-center gap-4 px-10 py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-[900] rounded-2xl transition-all shadow-2xl shadow-emerald-500/30 active:scale-95 hover:-translate-y-1"
                >
                  <Download className="w-6 h-6" /> 
                  Exporteer naar Word
                </button>
              </div>
              <div className="p-4 md:p-16 bg-slate-50/40">
                <div className="bg-white p-10 md:p-24 border border-slate-100 rounded-[3rem] shadow-inner min-h-[800px] whitespace-pre-wrap font-serif text-xl leading-relaxed text-slate-800 selection:bg-medical-100/60 transition-all">
                  {result}
                </div>
              </div>
              <div className="p-10 border-t border-slate-50 text-center">
                <p className="text-slate-400 text-sm font-semibold italic">
                  Controleer altijd de geanonimiseerde gegevens voor verzending.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

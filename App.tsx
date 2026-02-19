
import React, { useState, useCallback } from 'react';
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
  Loader2
} from 'lucide-react';
import InputSection from './components/InputSection';
import { fileToBase64, getMimeType } from './utils';

const App: React.FC = () => {
  // States voor de 4 inputs
  const [requestText, setRequestText] = useState('');
  const [requestFile, setRequestFile] = useState<FileData | undefined>();
  const [journalText, setJournalText] = useState('');
  const [specialistText, setSpecialistText] = useState('');
  const [specialistFile, setSpecialistFile] = useState<FileData | undefined>();

  // Globale status
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
        console.error("File upload error:", err);
      }
    }
  };

  const handleGenerate = async () => {
    if (!requestText && !requestFile && !journalText && !specialistText && !specialistFile) {
      setProcessing({ status: 'error', message: 'Voer ten minste één bron van informatie in.' });
      return;
    }

    setProcessing({ status: 'processing', message: 'Gegevens worden geanonimiseerd en verwerkt...' });
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
      console.error(err);
      setProcessing({ 
        status: 'error', 
        message: err.message || 'Er is een fout opgetreden bij het genereren van de brief.' 
      });
    }
  };

  const handleDownload = useCallback(async () => {
    if (result) {
      await downloadAsWord("Medisch informatieverzoek", result);
    }
  }, [result]);

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
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-2xl mb-4">
          <FileSearch className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Medisch Info Generator</h1>
        <p className="text-slate-600 text-lg">
          Genereer professionele, geanonimiseerde brieven op basis van medische dossiers.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <InputSection 
          title="1. Informatieverzoek" 
          description="Platte tekst, screenshot, pdf of foto van een brief."
          icon={<FileText className="w-5 h-5" />}
        >
          <textarea
            className="w-full h-32 p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none mb-3"
            placeholder="Typ of plak hier het verzoek..."
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
          />
          <div className="relative">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleFileUpload(e, setRequestFile)}
              className="hidden"
              id="request-file"
            />
            <label
              htmlFor="request-file"
              className="flex items-center justify-center gap-2 p-2 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all text-sm font-medium text-slate-600"
            >
              <Upload className="w-4 h-4" />
              {requestFile ? requestFile.name : "Bestand uploaden"}
            </label>
          </div>
        </InputSection>

        <InputSection 
          title="2. Medische Journaalregels" 
          description="Kopieer journaalregels vanuit het HIS als platte tekst."
          icon={<ClipboardList className="w-5 h-5" />}
        >
          <textarea
            className="w-full h-48 p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            placeholder="Plak hier de journaalregels..."
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
          />
        </InputSection>

        <InputSection 
          title="3. Specialistenbrief (Tekst)" 
          description="Inhoud van een brief als platte tekst."
          icon={<Stethoscope className="w-5 h-5" />}
        >
          <textarea
            className="w-full h-48 p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            placeholder="Plak hier de tekst van de specialist..."
            value={specialistText}
            onChange={(e) => setSpecialistText(e.target.value)}
          />
        </InputSection>

        <InputSection 
          title="4. Specialistenbrief (Bestand)" 
          description="Word, PDF of foto van een specialistenbrief."
          icon={<Upload className="w-5 h-5" />}
        >
          <div className="flex flex-col justify-center h-48">
            <input
              type="file"
              accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,image/*"
              onChange={(e) => handleFileUpload(e, setSpecialistFile)}
              className="hidden"
              id="specialist-file"
            />
            <label
              htmlFor="specialist-file"
              className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
            >
              <div className="p-3 bg-slate-100 rounded-full">
                <Upload className="w-6 h-6 text-slate-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">
                  {specialistFile ? specialistFile.name : "Kies een bestand"}
                </p>
                <p className="text-xs text-slate-400 mt-1">Word, PDF of afbeeldingen</p>
              </div>
            </label>
            {specialistFile && (
               <button 
                onClick={() => setSpecialistFile(undefined)}
                className="mt-4 text-xs text-red-500 hover:underline mx-auto"
               >
                 Verwijderen
               </button>
            )}
          </div>
        </InputSection>
      </div>

      <div className="sticky bottom-8 z-10 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {processing.status === 'processing' ? (
            <div className="flex items-center gap-2 text-blue-600 font-medium">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{processing.message}</span>
            </div>
          ) : processing.status === 'error' ? (
            <div className="flex items-center gap-2 text-red-600 font-medium">
              <AlertCircle className="w-5 h-5" />
              <span>{processing.message}</span>
            </div>
          ) : processing.status === 'success' ? (
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle2 className="w-5 h-5" />
              <span>Brief succesvol gegenereerd!</span>
            </div>
          ) : (
            <span className="text-slate-500 text-sm">Vul de velden in om te beginnen.</span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={resetForm}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleGenerate}
            disabled={processing.status === 'processing'}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 transition-all"
          >
            {processing.status === 'processing' ? 'Bezig...' : 'Genereer Brief'}
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Preview: Medisch Informatieverzoek
            </h2>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors shadow-md shadow-green-100"
            >
              <Download className="w-4 h-4" />
              Download .docx
            </button>
          </div>
          <div className="p-8 md:p-12 prose prose-slate max-w-none">
            <div className="bg-white border border-slate-100 shadow-inner p-8 rounded-lg min-h-[400px] whitespace-pre-wrap font-serif text-slate-800 leading-relaxed text-sm md:text-base">
              {result}
            </div>
          </div>
          <div className="bg-amber-50 p-4 text-xs text-amber-700 text-center border-t border-amber-100 italic">
            Let op: Controleer altijd de geanonimiseerde gegevens voordat u de brief verstuurt.
          </div>
        </div>
      )}

      <footer className="mt-16 text-center text-slate-400 text-xs">
        <p>&copy; {new Date().getFullYear()} Medisch Info Generator - Beveiligd & Geanonimiseerd</p>
      </footer>
    </div>
  );
};

export default App;

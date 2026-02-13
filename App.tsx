
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { processMedicalData } from './services/geminiService';
import { downloadAsWord } from './services/wordService';
import { AppState, Step } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    journalText: '',
    specialistLettersText: '',
    requestFileData: null,
    requestFileType: null,
    specialistImage: null,
    isProcessing: false,
    result: null,
    error: null,
  });
  const [activeStep, setActiveStep] = useState<Step>(Step.INPUT);
  const requestFileRef = useRef<HTMLInputElement>(null);
  const specialistFileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((file: File, key: 'request' | 'specialist') => {
    // Check for supported types before processing
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (key === 'request' && !isImage && !isPdf) {
      setState(prev => ({ ...prev, error: 'Voor bestanden worden momenteel alleen afbeeldingen en PDF ondersteund. Plak tekst voor Word documenten.' }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (key === 'request') {
        setState(prev => ({ 
          ...prev, 
          requestFileData: reader.result as string,
          requestFileType: file.type,
          error: null
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          specialistImage: reader.result as string,
          error: null
        }));
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, key: 'request' | 'specialist') => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file, key);
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (activeStep !== Step.INPUT) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileUpload(file, 'request');
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeStep, handleFileUpload]);

  const handleProcess = async () => {
    const hasInput = state.journalText || state.requestFileData || state.specialistLettersText || state.specialistImage;
    
    if (!hasInput) {
      setState(prev => ({ ...prev, error: 'Voer a.u.b. medische gegevens in of upload documenten.' }));
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    setActiveStep(Step.PROCESSING);

    try {
      const result = await processMedicalData(
        state.journalText, 
        state.specialistLettersText, 
        state.requestFileData, 
        state.requestFileType,
        state.specialistImage
      );
      setState(prev => ({ ...prev, result, isProcessing: false }));
      setActiveStep(Step.RESULT);
    } catch (err: any) {
      console.error('Processing error:', err);
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: 'Er is een fout opgetreden bij de AI-verwerking. Controleer of de bestanden niet te groot zijn en probeer het opnieuw.' 
      }));
      setActiveStep(Step.INPUT);
    }
  };

  const resetForm = () => {
    setState({
      journalText: '',
      specialistLettersText: '',
      requestFileData: null,
      requestFileType: null,
      specialistImage: null,
      isProcessing: false,
      result: null,
      error: null,
    });
    setActiveStep(Step.INPUT);
  };

  const isImageMime = (mime: string | null) => mime?.startsWith('image/');

  return (
    <div className="min-h-screen pb-12">
      <header className="bg-blue-700 text-white py-6 shadow-md mb-8">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Medisch Brief Generator</h1>
            <p className="text-blue-100 opacity-90 text-sm">HIS & Specialist Integratie</p>
          </div>
          <div className="hidden md:block text-right">
            <span className="bg-blue-600 px-3 py-1 rounded-full text-[10px] font-bold border border-blue-400 uppercase tracking-tighter">
              Private AI Processing
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-4xl">
        {activeStep === Step.INPUT && (
          <div className="space-y-6">
            {state.error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm animate-pulse">
                <p className="text-sm text-red-700 font-medium">{state.error}</p>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  1. HIS Journaal & Verzoek
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Journaalregels HIS</label>
                    <textarea
                      className="flex-grow min-h-[160px] w-full p-4 border border-slate-200 rounded-lg text-sm font-mono bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Plak hier de journaalregels uit het HIS..."
                      value={state.journalText}
                      onChange={(e) => setState(prev => ({ ...prev, journalText: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Bestand Informatieverzoek</label>
                    <div 
                      onClick={() => requestFileRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleFileUpload(file, 'request');
                      }}
                      className={`h-[160px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group ${
                        state.requestFileData ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <input 
                        type="file" 
                        accept="image/*,application/pdf" 
                        className="hidden" 
                        ref={requestFileRef} 
                        onChange={(e) => onFileInputChange(e, 'request')} 
                      />
                      
                      {state.requestFileData ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2">
                          {isImageMime(state.requestFileType) ? (
                            <img src={state.requestFileData} className="h-24 object-contain mb-1 rounded shadow-sm" alt="Preview" />
                          ) : (
                            <div className="text-center">
                              <svg className="w-12 h-12 text-blue-600 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                              <p className="text-[10px] font-bold text-blue-700 mt-1 uppercase">PDF Document</p>
                            </div>
                          )}
                          <p className="text-[10px] text-slate-500 mt-1">Klik om te wijzigen</p>
                        </div>
                      ) : (
                        <div className="text-center p-4">
                          <svg className="w-10 h-10 text-slate-400 mx-auto mb-2 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-xs text-slate-500 font-medium">Klik, sleep of <span className="text-blue-600 font-bold">plak (Ctrl+V)</span></p>
                          <p className="text-[10px] text-slate-400 mt-1">PDF of Afbeeldingen</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-indigo-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  2. Specialistenbrieven (Optioneel)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Tekst uit brief / PDF / Word</label>
                    <textarea
                      className="flex-grow min-h-[160px] w-full p-4 border border-slate-200 rounded-lg text-sm font-mono bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="Plak hier relevante tekst uit de documenten van de specialist..."
                      value={state.specialistLettersText}
                      onChange={(e) => setState(prev => ({ ...prev, specialistLettersText: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Foto van fysieke brief</label>
                    <div 
                      onClick={() => specialistFileRef.current?.click()}
                      className={`h-[160px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden ${
                        state.specialistImage ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <input type="file" accept="image/*" capture="environment" className="hidden" ref={specialistFileRef} onChange={(e) => onFileInputChange(e, 'specialist')} />
                      {state.specialistImage ? (
                        <img src={state.specialistImage} className="h-full w-full object-contain p-2" alt="Specialist Letter" />
                      ) : (
                        <div className="text-center p-4">
                          <svg className="w-10 h-10 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p className="text-xs text-slate-500 font-medium">Scan papieren brief</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <button
                onClick={handleProcess}
                disabled={state.isProcessing}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-12 rounded-full shadow-xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-3"
              >
                <span>Genereer Geanonimiseerde Brief</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </button>
            </div>
          </div>
        )}

        {activeStep === Step.PROCESSING && (
          <div className="bg-white rounded-xl shadow-sm p-16 text-center border border-slate-200">
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Medische Analyse...</h2>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">De AI anonimiseert uw data en formuleert een professionele reactie. Dit duurt enkele seconden.</p>
          </div>
        )}

        {activeStep === Step.RESULT && state.result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> HIS Bron
                </h3>
                <div className="text-[11px] bg-slate-50 p-3 rounded-lg max-h-32 overflow-y-auto font-mono text-slate-500 leading-relaxed border border-slate-100">
                  {state.result.anonymizedJournal || "Geen HIS tekst verwerkt."}
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Specialist Bron
                </h3>
                <div className="text-[11px] bg-indigo-50 p-3 rounded-lg max-h-32 overflow-y-auto font-mono text-indigo-600 leading-relaxed border border-indigo-100">
                  {state.result.anonymizedSpecialistLetters || "Geen specialist tekst verwerkt."}
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Vraagstelling
                </h3>
                <p className="text-xs text-slate-700 italic font-medium leading-relaxed">"{state.result.extractedRequest}"</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 text-white px-8 py-5 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold">Concept Medische Brief</h2>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Gegenereerd door Medisch AI v3</p>
                </div>
                <button 
                  onClick={() => downloadAsWord(state.result!.generatedLetter)}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2.5 px-6 rounded-lg transition-all shadow-lg hover:shadow-green-900/20 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  Opslaan als .docx
                </button>
              </div>
              <div className="p-8 md:p-16 bg-slate-50 flex justify-center border-b border-slate-200">
                <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-[25mm] shadow-lg font-serif text-slate-800 text-sm md:text-base whitespace-pre-wrap leading-relaxed border border-slate-200">
                  {state.result.generatedLetter}
                </div>
              </div>
              <div className="p-6 bg-white flex justify-center">
                <button onClick={resetForm} className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  Nieuwe aanvraag starten
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;

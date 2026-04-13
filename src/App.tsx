import React, { useState, useEffect, useCallback } from 'react';
import { speechService } from './services/speechService';
import { vlibrasService } from './services/vlibrasService';
import AudioVisualizer from './components/AudioVisualizer';
import TranscriptDisplay from './components/TranscriptDisplay';
import VLibrasQueue from './components/VLibrasQueue';
import HistoryModal from './components/HistoryModal';
import SettingsModal from './components/SettingsModal';
import { storageUtils } from './utils/storageUtils';
import { TranscriptLine, Theme, ConnectionStatus, VisualizerStyle } from './types';
import { Mic, Square, Settings, History, Moon, Sun, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [error, setError] = useState<string | null>(null);
  const [rms, setRms] = useState(0);
  const [theme, setTheme] = useState<Theme>('dark');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCacheEnabled, setIsCacheEnabled] = useState(true);
  const [visualizerStyle, setVisualizerStyle] = useState<VisualizerStyle>('wave');

  // ── Estado da fila VLibras ────────────────────────────────────────────────
  const [vlibrasCurrentText, setVlibrasCurrentText] = useState<string | null>(null);
  const [vlibrasQueue, setVlibrasQueue] = useState<string[]>([]);

  // ── Inicialização ─────────────────────────────────────────────────────────
  useEffect(() => {
    setIsCacheEnabled(storageUtils.isCacheEnabled());
    setTranscripts(storageUtils.getTranscripts());
    const savedTheme = storageUtils.getTheme();
    setTheme(savedTheme);
    setVisualizerStyle(storageUtils.getVisualizerStyle());
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  // Registra callbacks no vlibrasService assim que o componente monta
  useEffect(() => {
    vlibrasService.setCallbacks({
      onTranslating: (text) => setVlibrasCurrentText(text),
      onQueueChange: (queue) => setVlibrasQueue([...queue]),
      onIdle: () => {
        setVlibrasCurrentText(null);
        setVlibrasQueue([]);
      },
    });
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const saveTranscripts = useCallback((newTranscripts: TranscriptLine[]) => {
    setTranscripts(newTranscripts);
    storageUtils.saveTranscripts(newTranscripts);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    storageUtils.setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleToggleCache = (enabled: boolean) => {
    setIsCacheEnabled(enabled);
    storageUtils.setCacheEnabled(enabled);
    if (!enabled) setTranscripts([]);
  };

  const handleVisualizerStyleChange = (style: VisualizerStyle) => {
    setVisualizerStyle(style);
    storageUtils.setVisualizerStyle(style);
  };

  // ── Controle de gravação ──────────────────────────────────────────────────
  const handleStart = async () => {
    try {
      setError(null);
      setStatus(ConnectionStatus.CONNECTING);

      await speechService.connect(
        (text, isFinal) => {
          if (isFinal) {
            setTranscripts((prev) => {
              const newTranscripts = [
                ...prev,
                {
                  id: uuidv4(),
                  text,
                  isFinal: true,
                  timestamp: Date.now(),
                  source: 'user',
                  inputType: 'voice',
                } as TranscriptLine,
              ];
              storageUtils.saveTranscripts(newTranscripts);
              return newTranscripts;
            });
            setCurrentTranscription('');

            // ✅ Enfileira o texto para o VLibras traduzir
            vlibrasService.translate(text);
          } else {
            setCurrentTranscription(text);
          }
        },
        (err) => {
          setError(err.message);
          setStatus(ConnectionStatus.ERROR);
          handleStop();
        },
        (volume) => setRms(volume)
      );

      setStatus(ConnectionStatus.CONNECTED);
    } catch (err: any) {
      setError(err.message || 'Failed to start recording');
      setStatus(ConnectionStatus.ERROR);
    }
  };

  const handleStop = async () => {
    await speechService.disconnect();
    setStatus(ConnectionStatus.DISCONNECTED);
    setRms(0);

    if (currentTranscription) {
      const finalTranscription = currentTranscription;
      setTranscripts((prev) => {
        const newTranscripts = [
          ...prev,
          {
            id: uuidv4(),
            text: finalTranscription,
            isFinal: true,
            timestamp: Date.now(),
            source: 'user',
            inputType: 'voice',
          } as TranscriptLine,
        ];
        storageUtils.saveTranscripts(newTranscripts);
        return newTranscripts;
      });
      setCurrentTranscription('');

      // ✅ Enfileira o texto restante para o VLibras traduzir
      vlibrasService.translate(finalTranscription);
    }
  };

  const clearHistory = () => {
    saveTranscripts([]);
    storageUtils.clearTranscripts();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col-reverse md:flex-row w-full h-screen overflow-hidden font-sans transition-colors duration-300 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Background Mesh */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-teal-500/20 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[40%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] mix-blend-screen" />
      </div>

      {/* ── Lado Esquerdo (Desktop) / Inferior (Mobile) — Conteúdo do App ── */}
      <div className="relative z-10 w-full md:w-[50vw] h-[50vh] md:h-full flex flex-col p-4 md:p-8 border-t md:border-t-0 md:border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
        <div className="max-w-2xl w-full mx-auto flex flex-col min-h-full">

          {/* Header */}
          <header className="flex items-center justify-between mb-3 md:mb-6">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white flex items-center justify-center shadow-lg shadow-teal-500/20 overflow-hidden shrink-0">
                <img
                  src={`/logo.png?v=${Date.now()}`}
                  alt="Logo Sussurro"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML =
                      '<span class="text-teal-500 font-bold text-xs md:text-sm">S</span>';
                  }}
                />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold tracking-tight leading-tight">Sussurro</h1>
                <p className="text-xs md:text-sm opacity-60 leading-tight">O barulho do silêncio</p>
              </div>
            </div>

            <div className="flex items-center space-x-1 md:space-x-2">
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="p-1.5 md:p-2 rounded-lg hover:bg-slate-800/10 dark:hover:bg-slate-800 transition-colors"
                title="Histórico"
              >
                <History className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={toggleTheme}
                className="p-1.5 md:p-2 rounded-lg hover:bg-slate-800/10 dark:hover:bg-slate-800 transition-colors"
                title="Alternar Tema"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 md:p-2 rounded-lg hover:bg-slate-800/10 dark:hover:bg-slate-800 transition-colors"
                title="Configurações"
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex flex-col min-h-0 space-y-3 md:space-y-6">
            {/* Error Banner */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start space-x-3 text-red-500">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Transcription Area */}
            <TranscriptDisplay
              transcripts={transcripts}
              currentTranscription={currentTranscription}
              isListening={status === ConnectionStatus.CONNECTED}
            />

            {/* ✅ Fila VLibras — texto atual em destaque + itens aguardando */}
            <VLibrasQueue
              currentTranslating={vlibrasCurrentText}
              queue={vlibrasQueue}
            />

            {/* Controls & Visualizer */}
            <div className="space-y-2 md:space-y-4">
              <AudioVisualizer 
                rms={rms} 
                isActive={status === ConnectionStatus.CONNECTED} 
                style={visualizerStyle}
              />

              <div className="flex justify-center pb-2">
                {status === ConnectionStatus.DISCONNECTED || status === ConnectionStatus.ERROR ? (
                  <button
                    onClick={handleStart}
                    className="group relative flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-teal-500 hover:bg-teal-400 text-white shadow-lg shadow-teal-500/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <Mic className="w-5 h-5 md:w-7 md:h-7" />
                    <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-xs px-2 py-1 rounded text-white whitespace-nowrap">
                      Iniciar Transcrição
                    </span>
                  </button>
                ) : status === ConnectionStatus.CONNECTING ? (
                  <button
                    disabled
                    className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-500 text-white opacity-50 cursor-not-allowed animate-pulse"
                  >
                    <Mic className="w-5 h-5 md:w-7 md:h-7" />
                  </button>
                ) : (
                  <button
                    onClick={handleStop}
                    className="group relative flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/30 transition-all hover:scale-105 active:scale-95 animate-pulse"
                  >
                    <Square className="w-4 h-4 md:w-6 md:h-6 fill-current" />
                    <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-800 text-xs px-2 py-1 rounded text-white whitespace-nowrap">
                      Parar Transcrição
                    </span>
                  </button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* ── Lado Direito (Desktop) / Superior (Mobile) — Área VLibras ── */}
      <div className="relative z-0 w-full md:w-[50vw] h-[50vh] md:h-full flex flex-col items-center justify-center bg-slate-100/50 dark:bg-slate-900/50">
        <div className="text-center opacity-50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center">
            <span className="text-2xl">🤟</span>
          </div>
          <p className="text-sm font-medium">Área reservada para o VLibras</p>
          <p className="text-xs mt-2">O widget aparecerá aqui quando ativado</p>
        </div>
      </div>

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        transcripts={transcripts}
        onClear={clearHistory}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isCacheEnabled={isCacheEnabled}
        onToggleCache={handleToggleCache}
        visualizerStyle={visualizerStyle}
        onVisualizerStyleChange={handleVisualizerStyleChange}
      />
    </div>
  );
}

export default App;

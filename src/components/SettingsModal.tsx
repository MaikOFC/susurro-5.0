import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Database, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCacheEnabled: boolean;
  onToggleCache: (enabled: boolean) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isCacheEnabled,
  onToggleCache,
}) => {
  const clearAppCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      alert('Cache do aplicativo limpo com sucesso!');
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 top-1/2 md:top-0 md:right-1/2 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="w-full max-w-[280px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-teal-500/10 rounded-md">
                  <Database className="w-3.5 h-3.5 text-teal-500" />
                </div>
                <h2 className="text-base font-bold">Configurações</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 space-y-3">
              {/* Toggle Cache de Histórico */}
              <div className="flex items-center justify-between">
                <div className="space-y-0">
                  <div className="flex items-center space-x-1.5">
                    <h3 className="font-semibold text-[13px]">Salvar Histórico</h3>
                    {isCacheEnabled ? 
                      <ShieldCheck className="w-3 h-3 text-teal-500" /> : 
                      <ShieldAlert className="w-3 h-3 text-amber-500" />
                    }
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Armazena transcrições.
                  </p>
                </div>
                <button
                  onClick={() => onToggleCache(!isCacheEnabled)}
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${
                    isCacheEnabled ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                      isCacheEnabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              {/* Limpar Cache do App */}
              <div className="space-y-2">
                <div className="space-y-0">
                  <h3 className="font-semibold text-[13px]">Memória do App</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Limpa arquivos e cache.
                  </p>
                </div>
                <button
                  onClick={clearAppCache}
                  className="w-full flex items-center justify-center space-x-1.5 p-2 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-colors text-xs font-medium"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpar e Reiniciar</span>
                </button>
              </div>
            </div>

            <div className="p-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[9px] text-center text-slate-500">
                Sussurro v5.0 • Privacidade
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;

import { AudioProcessor } from './AudioProcessor';
import { VoiceActivityDetector } from './VoiceActivityDetector';

export type TranscriptionCallback = (text: string, isFinal: boolean) => void;
export type ErrorCallback = (error: Error) => void;
export type VolumeCallback = (rms: number) => void;

// Detecta se o texto está em português (bloqueia outros alfabetos)
function estaEmPortugues(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed === '.') return false;

  const outrosAlfabetos = /[\u0400-\u04FF\u0900-\u097F\u0600-\u06FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/;
  if (outrosAlfabetos.test(trimmed)) return false;

  const apenasLetras = trimmed.replace(/[^a-zA-ZÀ-ÿ]/g, '');
  if (apenasLetras.length < 2) return false;

  return true;
}

function limparTexto(text: string): string {
  return text
    .trim()
    .replace(/^\.*$/, '')
    .replace(/\s+/g, ' ')
    .replace(/^[.,;:!?]+\s*/, '')
    .trim();
}

class SpeechService {
  private recognition: any = null;
  private volumeInterval: number | null = null;
  private isRunning = false;
  private isSpeaking = false;

  private onTranscriptionCallback?: TranscriptionCallback;
  private onErrorCallback?: ErrorCallback;
  private onVolumeChange?: VolumeCallback;

  constructor() {}

  async connect(
    onTranscription: TranscriptionCallback,
    onError: ErrorCallback,
    onVolumeChange?: VolumeCallback
  ): Promise<void> {
    this.onTranscriptionCallback = onTranscription;
    this.onErrorCallback = onError;
    this.onVolumeChange = onVolumeChange;

    // Verifica suporte do navegador
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error(
        'Este navegador não suporta reconhecimento de voz. Use Chrome ou Edge.'
      );
    }

    // Configura o reconhecimento de voz
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'pt-BR';
    this.recognition.continuous = true;       // não para após silêncio
    this.recognition.interimResults = true;   // mostra texto em tempo real
    this.recognition.maxAlternatives = 1;

    this.recognition.onsoundstart = () => {
      this.isSpeaking = true;
    };

    this.recognition.onsoundend = () => {
      this.isSpeaking = false;
    };

    this.recognition.onresult = (event: any) => {
      this.isSpeaking = true; // Garante que o visualizador reaja
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      // Mostra texto intermediário em tempo real
      if (interimText) {
        const texto = limparTexto(interimText);
        if (estaEmPortugues(texto)) {
          this.onTranscriptionCallback?.(texto, false);
        }
      }

      // Envia texto final quando a frase for concluída
      if (finalText) {
        const texto = limparTexto(finalText);
        if (texto.length > 1 && estaEmPortugues(texto)) {
          this.onTranscriptionCallback?.(texto, true);
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      // Ignora erros de "no-speech" — são normais durante silêncio
      if (event.error === 'no-speech') return;
      if (event.error === 'aborted') return;

      this.onErrorCallback?.(
        new Error(`Erro no reconhecimento de voz: ${event.error}`)
      );
    };

    // Reinicia automaticamente se parar (comportamento contínuo)
    this.recognition.onend = () => {
      this.isSpeaking = false;
      if (this.isRunning) {
        try {
          this.recognition.start();
        } catch {
          // já estava rodando
        }
      }
    };

    // Inicia medição de volume em loop (simulado para o visualizador)
    if (onVolumeChange) {
      this.volumeInterval = window.setInterval(() => {
        if (this.isSpeaking) {
          // Simula variação de volume enquanto fala
          onVolumeChange(0.1 + Math.random() * 0.3);
        } else {
          onVolumeChange(0);
        }
      }, 50);
    }

    this.isRunning = true;
    this.recognition.start();
  }

  async disconnect() {
    this.isRunning = false;
    this.isSpeaking = false;

    if (this.volumeInterval) {
      clearInterval(this.volumeInterval);
      this.volumeInterval = null;
    }

    if (this.recognition) {
      this.recognition.onend = null;
      this.recognition.stop();
      this.recognition = null;
    }

    this.onVolumeChange?.(0);
  }
}

export const speechService = new SpeechService();

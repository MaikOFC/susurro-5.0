export interface TranscriptLine {
  id: string;
  text: string;
  isFinal: boolean;
  timestamp: number;
  source: 'user' | 'model';
  inputType: 'voice' | 'text';
}

export type Theme = 'light' | 'dark';

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

import { Injectable, signal, computed } from '@angular/core';

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

@Injectable({
  providedIn: 'root'
})
export class SpeechRecognitionService {
  private recognition: any;
  private _isListening = signal<boolean>(false);
  private _transcript = signal<string>('');
  private _error = signal<string | null>(null);
  private finalTranscript: string = '';

  constructor() {
    this.initSpeechRecognition();
  }

  private initSpeechRecognition(): void {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      if ('webkitSpeechRecognition' in window) {
        this.recognition = new (window as any).webkitSpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
          console.log('Speech recognition started');
          this._isListening.set(true);
          this._error.set(null);
        };

        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          // Store the transcript but don't emit it yet
          // We'll emit it in the onend event to ensure isListening is false first
          const currentTranscript = finalTranscript || interimTranscript;

          // Only emit interim results while listening
          if (!event.results[event.results.length - 1].isFinal) {
            console.log('Interim transcript:', currentTranscript);
            this._transcript.set(currentTranscript);
          } else {
            // For final results, we'll store it and emit in onend
            console.log('Final transcript detected, storing:', currentTranscript);
            this.finalTranscript = currentTranscript;
          }
        };

        this.recognition.onerror = (event: any) => {
          console.log('Speech recognition error:', event.error);
          this._error.set(event.error);
          this._isListening.set(false);
        };

        this.recognition.onend = () => {
          console.log('Speech recognition ended');
          // Set isListening to false first
          this._isListening.set(false);

          // If we have a final transcript, emit it now that isListening is false
          if (this.finalTranscript) {
            console.log('Emitting final transcript:', this.finalTranscript);
            this._transcript.set(this.finalTranscript);
            this.finalTranscript = ''; // Clear it after emitting
          }
        };
      } else {
        this._error.set('Speech recognition not supported in this browser');
      }
    }
    // We don't emit an error for server-side rendering as it's expected behavior
  }

  startListening(): void {
    console.log('startListening called');
    // Only attempt to start listening if we're in a browser environment and recognition is initialized
    if (typeof window !== 'undefined' && this.recognition) {
      this._transcript.set('');
      this.finalTranscript = ''; // Clear any stored final transcript
      console.log('Starting speech recognition');
      this.recognition.start();
    } else {
      console.log('Cannot start speech recognition: window or recognition not available');
    }
    // We don't emit an error for server-side rendering as it's expected behavior
  }

  stopListening(): void {
    console.log('stopListening called');
    // Only attempt to stop listening if we're in a browser environment and recognition is initialized
    if (typeof window !== 'undefined' && this.recognition) {
      console.log('Stopping speech recognition');
      this.recognition.stop();
    } else {
      console.log('Cannot stop speech recognition: window or recognition not available');
    }
  }

  get isListening() {
    return this._isListening;
  }

  get transcript() {
    return this._transcript;
  }

  get error() {
    return this._error;
  }
}

import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';

// Declaraciones para compatibilidad
declare var webkitSpeechRecognition: any;
declare var SpeechRecognition: any;

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {

  isListening: boolean = false;
  isSpeaking: boolean = false; // <-- Propiedad devuelta
  transcript: string = '';

  // --- Propiedades para TTS ---
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  // -------------------------

  private recognition: any;
  public transcript$ = new Subject<string>();

  constructor(private ngZone: NgZone) {
    console.log("ChatbotService (STT y TTS) inicializado");
    this.setupTTS(); // Configura el habla
    this.setupSTT(); // Configura la escucha
  }

  // --- CONFIGURACIÓN DE TTS (Hablar) ---
  private setupTTS(): void {
    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth && this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    } else {
      console.error("SpeechSynthesis (TTS) no soportado.");
    }
  }

  private loadVoices(): void {
    if(this.synth) {
      this.voices = this.synth.getVoices();
    }
  }

  // --- CONFIGURACIÓN DE STT (Escuchar) ---
  private setupSTT(): void {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      this.recognition = new ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)();
      this.recognition.continuous = false;
      this.recognition.lang = 'es-PE';
      this.recognition.interimResults = false;

      this.recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const recognizedText = event.results[last][0].transcript;
        this.ngZone.run(() => {
          this.transcript = recognizedText;
          console.log("Texto reconocido:", this.transcript);
          this.transcript$.next(this.transcript);
          this.isListening = false;
        });
      };

      this.recognition.onend = () => { /* ... (código sin cambios) ... */ };
      this.recognition.onerror = (event: any) => { /* ... (código sin cambios) ... */ };

    } else {
      console.error("SpeechRecognition (STT) no soportado.");
      this.recognition = null;
    }
  }

  // --- MÉTODOS DE ESCUCHA (STT) ---
  startListening(): void {
    if (!this.recognition) { console.warn("STT no disponible."); return; }
    // Detiene el habla si está hablando
    if (this.isSpeaking) { this.stopSpeaking(); }
    if (this.isListening) { console.log("Ya está escuchando."); return; }
    
    this.ngZone.run(() => { this.isListening = true; this.transcript = ''; });
    this.recognition.start();
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.ngZone.run(() => { this.isListening = false; });
    }
  }

  // --- MÉTODOS DE HABLA (TTS) ---
  speak(text: string): void {
    if (!this.synth || !text) { console.warn("TTS no disponible o texto vacío."); return; }
    // Detiene la escucha si está escuchando
    if (this.isListening) { this.stopListening(); }
    if (this.synth.speaking) { this.synth.cancel(); }

    const utterance = new SpeechSynthesisUtterance(text);
    const spanishVoice = this.voices.find(voice => voice.lang.startsWith('es-ES') || voice.lang.startsWith('es-LA') || voice.lang.startsWith('es-PE') || voice.lang.startsWith('es-US'));
    
    if (spanishVoice) {
      utterance.voice = spanishVoice;
      utterance.lang = spanishVoice.lang;
    } else {
        utterance.lang = 'es-ES';
    }
    utterance.pitch = 1;
    utterance.rate = 0.9;
    utterance.volume = 1;

    utterance.onstart = () => { this.ngZone.run(() => { this.isSpeaking = true; }); };
    utterance.onend = () => { this.ngZone.run(() => { this.isSpeaking = false; }); };
    utterance.onerror = (event) => { this.ngZone.run(() => { this.isSpeaking = false; }); };

    this.synth.speak(utterance);
  }

  stopSpeaking(): void {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
  }
}

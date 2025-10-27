import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment.prod';

declare var webkitSpeechRecognition: any;
declare var SpeechRecognition: any;

interface ChatRequest {
  message: string;
}

interface ChatResponse {
  reply: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {

  isListening: boolean = false;
  isSpeaking: boolean = false;
  transcript: string = '';

  // --- INICIALIZACIÓN DIRECTA ---
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];

  private recognition: any;
  public transcript$ = new Subject<string>();

  private backendUrl = `${environment.apiUrl}/chatbot`;

  constructor(
    private ngZone: NgZone,
    private http: HttpClient
  ) {
    console.log("ChatbotService inicializado");
    this.setupTTS(); // Llama a los métodos de configuración
    this.setupSTT();
  }

  private setupTTS(): void {
    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis; // Asigna si es compatible
      this.loadVoices();
      // Asegura que las voces se carguen si cambian después
      if (this.synth && this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    } else {
      console.error("SpeechSynthesis (TTS) no soportado.");
      // No es necesario asignar null aquí
    }
  }

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
          this.sendToAI(this.transcript);
        });
      };

      this.recognition.onend = () => {
        this.ngZone.run(() => {
          if (this.isListening) {
             console.log("Se detuvo la escucha (silencio o fin).");
             this.isListening = false;
          }
        });
      };

      this.recognition.onerror = (event: any) => {
        this.ngZone.run(() => {
          console.error("Error en SpeechRecognition:", event.error);
          this.isListening = false;
        });
      };

    } else {
      console.error("SpeechRecognition (STT) no soportado por este navegador.");
      this.recognition = null;
    }
  }

  private loadVoices(): void {
    if(this.synth) { // Verifica que synth no sea null
      this.voices = this.synth.getVoices();
    }
  }

  startListening(): void {
    if (!this.recognition) { console.warn("STT no disponible."); return; }
    if (this.isListening || this.isSpeaking) { console.log("Ya está escuchando o hablando."); return; }
    this.ngZone.run(() => {
      this.isListening = true;
      this.transcript = '';
      console.log("Iniciando escucha...");
    });
    this.recognition.start();
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      console.log("Deteniendo escucha manualmente...");
      this.recognition.stop();
      this.ngZone.run(() => { this.isListening = false; });
    }
  }

  speak(text: string): void {
    if (!this.synth || !text) { console.warn("TTS no disponible o texto vacío."); return; }
    if (this.synth.speaking) { this.synth.cancel(); }

    const utterance = new SpeechSynthesisUtterance(text);
    const spanishVoice = this.voices.find(voice => voice.lang.startsWith('es-ES') || voice.lang.startsWith('es-LA') || voice.lang.startsWith('es-PE') || voice.lang.startsWith('es-US'));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
      utterance.lang = spanishVoice.lang;
    } else {
        utterance.lang = 'es-ES';
        console.warn("No se encontró una voz en español preferida, usando la predeterminada.");
    }
    utterance.pitch = 1;
    utterance.rate = 0.9;
    utterance.volume = 1;

    utterance.onstart = () => { this.ngZone.run(() => { this.isSpeaking = true; console.log("Empezando a hablar..."); }); };
    utterance.onend = () => { this.ngZone.run(() => { this.isSpeaking = false; console.log("Terminado de hablar."); }); };
    utterance.onerror = (event) => { this.ngZone.run(() => { console.error("Error en SpeechSynthesis:", event.error); this.isSpeaking = false; }); };

    console.log("Intentando hablar:", text);
    this.synth.speak(utterance);
  }

  sendToAI(text: string): void {
    if (!text) return;
    console.log("Enviando a IA (via proxy):", text);
    const request: ChatRequest = { message: text };
    this.http.post<ChatResponse>(`${this.backendUrl}/ask`, request)
      .subscribe({
        next: (response) => { this.handleAIResponse(response.reply); },
        error: (error: HttpErrorResponse) => {
          console.error("Error al llamar al backend proxy:", error);
          this.speak("Lo siento, hubo un problema al procesar tu solicitud.");
        }
      });
  }

  handleAIResponse(replyText: string): void {
    console.log("Respuesta de IA recibida:", replyText);
    this.speak(replyText);
  }
}

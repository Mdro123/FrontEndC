import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';

// Declaraciones para compatibilidad con TypeScript y prefijos de navegador
declare var webkitSpeechRecognition: any;
declare var SpeechRecognition: any;

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {

  isListening: boolean = false;
  isSpeaking: boolean = false;
  transcript: string = '';

  // Propiedades para TTS (Text-to-Speech)
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];

  // Propiedades para STT (Speech-to-Text)
  private recognition: any; // Se usa 'any' por los prefijos
  public transcript$ = new Subject<string>(); // Emite el texto reconocido

  constructor(private ngZone: NgZone) {
    console.log("ChatbotService inicializado");

    // Configuración TTS
    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    } else {
      console.error("SpeechSynthesis (TTS) no es soportado por este navegador.");
      this.synth = null!;
    }

    // Configuración STT
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      // --- CORRECCIÓN APLICADA AQUÍ con (window as any) ---
      this.recognition = new ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)();
      // -----------------------------------------------------

      this.recognition.continuous = false;
      this.recognition.lang = 'es-PE';
      this.recognition.interimResults = false;

      // Evento cuando se reconoce voz
      this.recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const recognizedText = event.results[last][0].transcript;
        this.ngZone.run(() => { // Asegura que Angular detecte cambios
          this.transcript = recognizedText;
          console.log("Texto reconocido:", this.transcript);
          this.transcript$.next(this.transcript); // Emitir texto
          this.isListening = false; // Detener escucha tras resultado
          // En el futuro: this.sendToAI(this.transcript);
        });
      };

      // Evento al finalizar la escucha
      this.recognition.onend = () => {
        this.ngZone.run(() => {
          if (this.isListening) {
             console.log("Se detuvo la escucha (silencio o fin).");
             this.isListening = false;
          }
        });
      };

      // Evento de error
      this.recognition.onerror = (event: any) => {
        this.ngZone.run(() => {
          console.error("Error en SpeechRecognition:", event.error);
          this.isListening = false;
        });
      };

    } else {
      console.error("SpeechRecognition (STT) no es soportado por este navegador.");
      this.recognition = null;
    }
  }

  // Carga las voces disponibles para TTS
  private loadVoices(): void {
    this.voices = this.synth.getVoices();
  }

  // Inicia el reconocimiento de voz
  startListening(): void {
    if (!this.recognition) {
      console.warn("STT no disponible.");
      return;
    }
    if (this.isListening || this.isSpeaking) {
      console.log("Ya está escuchando o hablando.");
      return;
    }
    this.ngZone.run(() => {
      this.isListening = true;
      this.transcript = '';
      console.log("Iniciando escucha...");
    });
    this.recognition.start();
  }

  // Detiene el reconocimiento de voz
  stopListening(): void {
    if (this.recognition && this.isListening) {
      console.log("Deteniendo escucha manualmente...");
      this.recognition.stop();
      this.ngZone.run(() => {
        this.isListening = false;
      });
    }
  }

  // Lee un texto en voz alta
  speak(text: string): void {
    if (!this.synth || !text) {
      console.warn("TTS no disponible o texto vacío.");
      return;
    }
    if (this.synth.speaking) {
      this.synth.cancel();
    }
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

    utterance.onstart = () => {
      this.ngZone.run(() => { this.isSpeaking = true; console.log("Empezando a hablar..."); });
    };
    utterance.onend = () => {
      this.ngZone.run(() => { this.isSpeaking = false; console.log("Terminado de hablar."); });
    };
    utterance.onerror = (event) => {
      this.ngZone.run(() => { console.error("Error en SpeechSynthesis:", event.error); this.isSpeaking = false; });
    };

    console.log("Intentando hablar:", text);
    this.synth.speak(utterance);
  }

  // Placeholder para enviar texto a la IA
  sendToAI(text: string): void {
    console.log("Enviando a IA:", text);
    // TODO: Implementar llamada HTTP al backend proxy
  }

  // Placeholder para manejar la respuesta de la IA
  handleAIResponse(response: any): void {
    console.log("Respuesta de IA recibida:", response);
    // TODO: Interpretar respuesta y ejecutar acciones
    // TODO: Llamar a speak() con la respuesta
  }
}

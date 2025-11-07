import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';

declare var webkitSpeechRecognition: any;
declare var SpeechRecognition: any;

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {

  isListening: boolean = false;
  transcript: string = '';

  private recognition: any;
  public transcript$ = new Subject<string>(); // Emite el texto reconocido

  constructor(private ngZone: NgZone) {
    console.log("ChatbotService (solo STT) inicializado");
    this.setupSTT();
  }

  // --- CONFIGURACIÓN DE STT (Speech-to-Text) ---
  private setupSTT(): void {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      this.recognition = new ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)();
      this.recognition.continuous = false;
      this.recognition.lang = 'es-PE';
      this.recognition.interimResults = false;

      // Evento: Cuando se detecta voz y se transcribe
      this.recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const recognizedText = event.results[last][0].transcript;
        
        this.ngZone.run(() => {
          this.transcript = recognizedText;
          console.log("Texto reconocido:", this.transcript);
          this.transcript$.next(this.transcript); // Emite el texto
          this.isListening = false;
          
        });
      };

      // Evento: Cuando termina la escucha
      this.recognition.onend = () => {
        this.ngZone.run(() => {
          if (this.isListening) {
             console.log("Se detuvo la escucha (silencio o fin).");
             this.isListening = false;
          }
        });
      };

      // Evento: Manejo de errores
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

  // Inicia el reconocimiento de voz
  startListening(): void {
    if (!this.recognition) {
      console.warn("STT no disponible.");
      return;
    }
    if (this.isListening) { // Modificado: ya no comprueba 'isSpeaking'
      console.log("Ya está escuchando.");
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

}

import { Injectable, NgZone } from '@angular/core'; // Importa NgZone

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {

  isListening: boolean = false;
  isSpeaking: boolean = false;
  transcript: string = '';

  // Propiedades para TTS
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];

  constructor(private ngZone: NgZone) { // Inyecta NgZone
    console.log("ChatbotService inicializado");
    
    // Verifica si SpeechSynthesis es compatible
    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices(); // Carga las voces cuando estén disponibles
      // Asegura que las voces se carguen si cambian después de la inicialización
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    } else {
      console.error("SpeechSynthesis (TTS) no es soportado por este navegador.");
      this.synth = null!; // Establece explícitamente a null si no es compatible
    }
  }

  // Método auxiliar para cargar las voces disponibles
  private loadVoices(): void {
    this.voices = this.synth.getVoices();
    // console.log("Voces cargadas:", this.voices); // Opcional: ver las voces disponibles en la consola
  }

  // Iniciará el reconocimiento de voz
  startListening(): void {
    console.log("Iniciando escucha...");
    // TODO: Implementar SpeechRecognition
  }

  // Detendrá el reconocimiento de voz
  stopListening(): void {
    console.log("Deteniendo escucha...");
    // TODO: Implementar SpeechRecognition stop
  }

  // Leerá un texto en voz alta
  speak(text: string): void {
    if (!this.synth || !text) {
      console.warn("TTS no disponible o texto vacío.");
      return;
    }

    // Detiene cualquier locución actual antes de empezar una nueva
    if (this.synth.speaking) {
      this.synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Intenta establecer una voz en español (puede que necesites ajustar según las voces disponibles)
    const spanishVoice = this.voices.find(voice => voice.lang.startsWith('es-ES') || voice.lang.startsWith('es-LA') || voice.lang.startsWith('es-PE') || voice.lang.startsWith('es-US')); // Ampliada búsqueda de voces en español
    if (spanishVoice) {
      utterance.voice = spanishVoice;
      utterance.lang = spanishVoice.lang; // Asegura que el idioma coincida con la voz
    } else {
        utterance.lang = 'es-ES'; // Idioma de respaldo
        console.warn("No se encontró una voz en español preferida, usando la predeterminada.");
    }

    utterance.pitch = 1;  // Rango 0 a 2
    utterance.rate = 0.9; // Rango 0.1 a 10 (ligeramente más lento para claridad)
    utterance.volume = 1; // Rango 0 a 1

    // Actualiza el estado usando NgZone para que Angular detecte los cambios
    utterance.onstart = () => {
      this.ngZone.run(() => {
        this.isSpeaking = true;
        console.log("Empezando a hablar...");
      });
    };

    utterance.onend = () => {
      this.ngZone.run(() => {
        this.isSpeaking = false;
        console.log("Terminado de hablar.");
      });
    };

    utterance.onerror = (event) => {
      this.ngZone.run(() => {
        console.error("Error en SpeechSynthesis:", event.error);
        this.isSpeaking = false;
      });
    };
    
    console.log("Intentando hablar:", text);
    this.synth.speak(utterance);
  }

  // Enviará el texto a la IA (a través del proxy)
  sendToAI(text: string): void {
    console.log("Enviando a IA:", text);
    // TODO: Implementar llamada HTTP al backend proxy
  }

  // Método para manejar la respuesta de la IA
  handleAIResponse(response: any): void {
    console.log("Respuesta de IA recibida:", response);
    // TODO: Interpretar respuesta y ejecutar acciones
    // TODO: Llamar a speak() con la respuesta
  }
}

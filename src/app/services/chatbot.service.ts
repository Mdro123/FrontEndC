import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {

  // Propiedades para manejar el estado (más adelante)
  isListening: boolean = false;
  isSpeaking: boolean = false;
  transcript: string = ''; // Texto reconocido por STT

  constructor() {
    console.log("ChatbotService inicializado");
    // Aquí inicializaremos las APIs del navegador más adelante
  }

  // Métodos que implementaremos en los siguientes pasos:

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
    console.log("Hablando:", text);
    // TODO: Implementar SpeechSynthesis
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

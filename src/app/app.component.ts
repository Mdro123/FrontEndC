import { Component, OnDestroy } from '@angular/core'; // Import OnDestroy
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'; // Make sure MatIconModule is imported
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs'; // Import Subscription
import { map } from 'rxjs/operators';
import { AuthService, UserData } from './services/auth.service';
import { CartService } from './services/cart.service';
import { ChatbotService } from './services/chatbot.service'; // Import ChatbotService

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule,
    MatIconModule, MatMenuModule, MatBadgeModule, FormsModule // MatIconModule added to imports
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy {
  isLoggedIn$: Observable<boolean>;
  currentUser$: Observable<UserData | null>;
  isAdmin$: Observable<boolean>;
  cartItemCount$: Observable<number>;

  // --- Propiedades para probar el Chatbot ---
  recognizedText: string = '';
  private transcriptSubscription: Subscription; // Para limpiar la suscripción

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router,
    public chatbotService: ChatbotService // Make ChatbotService public for template access
  ) {
    this.isLoggedIn$ = this.authService.currentUser.pipe(map(user => !!user));
    this.currentUser$ = this.authService.currentUser;
    this.isAdmin$ = this.authService.currentUser.pipe(map(user => user?.roles?.includes('ADMIN') ?? false));
    this.cartItemCount$ = this.cartService.getCartItemCount();

    // Suscribe to the transcript changes from the chatbot service
    this.transcriptSubscription = this.chatbotService.transcript$.subscribe(text => {
      this.recognizedText = text;
    });
  }

  // --- Método para probar la función de hablar ---
  testSpeak() {
    this.chatbotService.speak('Hola, esto es una prueba de voz.');
  }

  // --- Método para iniciar/detener la escucha ---
  toggleListen(): void {
    if (this.chatbotService.isListening) {
      this.chatbotService.stopListening();
    } else {
      this.recognizedText = ''; // Clear previous text when starting to listen
      this.chatbotService.startListening();
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // --- Limpia la suscripción al destruir el componente ---
  ngOnDestroy(): void {
    if (this.transcriptSubscription) {
      this.transcriptSubscription.unsubscribe();
    }
  }
}

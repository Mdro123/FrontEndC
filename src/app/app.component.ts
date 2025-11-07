import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService, UserData } from './services/auth.service';
import { CartService } from './services/cart.service';
// No importamos ChatbotService ni OnDestroy ni Subscription

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule,
    MatIconModule, MatMenuModule, MatBadgeModule, FormsModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent { // Ya no implementa OnDestroy
  title = 'libreria-crisol-frontend';
  isLoggedIn$: Observable<boolean>;
  currentUser$: Observable<UserData | null>;
  isAdmin$: Observable<boolean>;
  cartItemCount$: Observable<number>;

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {
    this.isLoggedIn$ = this.authService.currentUser.pipe(map(user => !!user));
    this.currentUser$ = this.authService.currentUser;
    this.isAdmin$ = this.authService.currentUser.pipe(map(user => user?.roles?.includes('ADMIN') ?? false));
    this.cartItemCount$ = this.cartService.getCartItemCount();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

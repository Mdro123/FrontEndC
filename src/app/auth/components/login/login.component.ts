import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  onLogin(): void {
    this.errorMessage = null;
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        if (error.status === 401) {
          this.errorMessage = 'Credenciales incorrectas. Por favor, verifica tu email y contraseña.';
        } else {
          this.errorMessage = 'Ocurrió un error. Por favor, inténtalo de nuevo más tarde.';
        }
      }
    });
  }
}

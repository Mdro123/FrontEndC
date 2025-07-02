import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterLink,
    MatSelectModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  nombres = '';
  apellidos = '';
  tipoDocumento = '';
  numeroDocumento = '';
  telefono = '';
  fechaNacimiento = '';
  email = '';
  password = '';
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  /**
   * Envía los datos del formulario al servicio de autenticación para registrar un nuevo usuario.
   */
  onRegister(): void {
    this.errorMessage = null;
    this.successMessage = null;

    const userData = {
      nombres: this.nombres,
      apellidos: this.apellidos,
      tipoDocumento: this.tipoDocumento,
      numeroDocumento: this.numeroDocumento,
      telefono: this.telefono,
      fechaNacimiento: this.fechaNacimiento,
      email: this.email,
      password: this.password
    };

    this.authService.register(userData).subscribe({
      next: (response) => {
        this.successMessage = '¡Registro exitoso! Serás redirigido para iniciar sesión.';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        if (error.status === 400 || error.status === 409) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Ocurrió un error durante el registro. Por favor, inténtalo de nuevo.';
        }
      }
    });
  }
}

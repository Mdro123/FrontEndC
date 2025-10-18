import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
// --- IMPORTACIONES CLAVE QUE FALTABAN ---
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule, MatHint } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

// Validador personalizado para la fecha de nacimiento
export function birthDateValidator(): (control: AbstractControl) => ValidationErrors | null {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    const birthDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const userTimezoneOffset = birthDate.getTimezoneOffset() * 60000;
    const adjustedBirthDate = new Date(birthDate.getTime() + userTimezoneOffset);
    if (adjustedBirthDate > today) {
      return { futureDate: true };
    }
    let age = today.getFullYear() - adjustedBirthDate.getFullYear();
    const monthDiff = today.getMonth() - adjustedBirthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < adjustedBirthDate.getDate())) {
      age--;
    }
    if (age > 90) {
      return { maxAgeExceeded: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    // --- IMPORTACIÓN CLAVE QUE FALTABA ---
    ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, RouterLink, MatHint
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit, OnDestroy {
  // --- PROPIEDADES QUE FALTABAN ---
  registerForm!: FormGroup;
  isUnderage: boolean = false;
  
  errorMessage: string | null = null;
  successMessage: string | null = null;
  private birthDateSubscription!: Subscription;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$')]],
      apellidos: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      tipoDocumento: ['DNI', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(8), Validators.pattern('^\\d+$')]],
      telefono: ['', [Validators.required, Validators.minLength(9), Validators.maxLength(9), Validators.pattern('^\\d+$')]],
      fechaNacimiento: ['', [Validators.required, birthDateValidator()]],
      email: ['', [Validators.required, Validators.maxLength(50), Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]]
    });

    const birthDateControl = this.registerForm.get('fechaNacimiento');
    if (birthDateControl) {
      this.birthDateSubscription = birthDateControl.valueChanges.subscribe(value => {
        if (value) {
          const birthDate = new Date(value);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          this.isUnderage = age >= 0 && age < 18;
        } else {
          this.isUnderage = false;
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.birthDateSubscription) {
      this.birthDateSubscription.unsubscribe();
    }
  }

  onRegister(): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.registerForm.markAllAsTouched();
    if (this.registerForm.invalid) {
      return;
    }
    this.authService.register(this.registerForm.value).subscribe({
      next: (response) => {
        this.successMessage = '¡Registro exitoso! Serás redirigido para iniciar sesión.';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        if (error.status === 400 && error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Ocurrió un error durante el registro. Por favor, inténtalo de nuevo.';
        }
      }
    });
  }
}

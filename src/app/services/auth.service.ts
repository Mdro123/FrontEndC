// src/app/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { CartService } from './cart.service'; // Asegúrate de que este path sea correcto

// --- Importar el archivo de entorno ---
import { environment } from '../../environments/environment.prod';
// ------------------------------------

// Interfaz para la solicitud de Login
interface LoginRequest {
  email: string;
  password: string;
}

// Interfaz para la solicitud de Registro
interface RegisterRequest {
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  telefono: string;
  fechaNacimiento: string;
  email: string;
  password: string;
}

// Interfaz para la respuesta de Login
interface LoginResponse {
  token: string;
  message: string;
  email: string; // Puede que necesites ajustar esto si tu backend devuelve más info
}

// Interfaz para los datos del usuario decodificados del token
export interface UserData {
  id: number;
  email: string;
  roles: string[];
  nombres: string;
  apellidos: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // --- Usar la URL base del entorno ---
  private baseUrl = environment.apiUrl;
  // Construir la URL completa para el endpoint de usuarios
  private userApiUrl = `${this.baseUrl}/usuarios`;
  // ------------------------------------

  private tokenKey = 'jwt_token'; // Clave para almacenar el token en localStorage

  // Sujeto que almacena el estado actual del usuario (logueado o no, y sus datos)
  private currentUserSubject: BehaviorSubject<UserData | null>;
  // Observable público para que otros componentes se suscriban a los cambios del usuario
  public currentUser: Observable<UserData | null>;

  constructor(
    private http: HttpClient, // Para hacer peticiones HTTP
    private jwtHelper: JwtHelperService, // Para manejar los tokens JWT
    private cartService: CartService // Para interactuar con el servicio del carrito
  ) {
    this.currentUserSubject = new BehaviorSubject<UserData | null>(null);
    this.currentUser = this.currentUserSubject.asObservable();
    this.checkAuthStatusOnLoad(); // Verificar el estado de autenticación al cargar el servicio
  }

  /**
   * Verifica el estado de autenticación del usuario al cargar el servicio.
   * Si hay un token válido, lo decodifica y establece el usuario actual.
   * Si no, limpia el token y el carrito.
   */
  private checkAuthStatusOnLoad(): void {
    const token = this.getToken();
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      const userData = this.getDecodedTokenData(token);
      this.currentUserSubject.next(userData);
    } else {
      // Si el token no es válido o no existe, removerlo y limpiar el carrito
      this.removeToken();
      this.cartService.clearCart(); // Limpia el carrito cuando el token expira o no es válido
    }
  }

  /**
   * Decodifica el token JWT y extrae los datos del usuario.
   * @param token El token JWT.
   * @returns Los datos del usuario o null si hay un error.
   */
  private getDecodedTokenData(token: string): UserData | null {
    try {
      const decodedToken = this.jwtHelper.decodeToken(token);
      // Asegura que roles sea un array y remueve el prefijo 'ROLE_'
      const roles = Array.isArray(decodedToken.roles) ? decodedToken.roles.map((r: string) => r.replace('ROLE_', '')) : [];
      return {
        id: decodedToken.id || -1, // Asume que el ID del usuario está en el token
        email: decodedToken.sub, // 'sub' suele ser el email o nombre de usuario
        roles: roles,
        nombres: decodedToken.nombres || '', // Asume 'nombres' está en el token
        apellidos: decodedToken.apellidos || '' // Asume 'apellidos' está en el token
      };
    } catch (error) {
      console.error('Error decodificando el token:', error);
      return null;
    }
  }

  /**
   * Obtiene el token JWT del almacenamiento local.
   * @returns El token o null si no existe.
   */
  public getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Guarda el token JWT en el almacenamiento local y actualiza el estado del usuario.
   * @param token El token JWT a guardar.
   */
  private saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    const userData = this.getDecodedTokenData(token);
    this.currentUserSubject.next(userData);
    // Nota: Aquí no se limpia el carrito al loguearse. Si quieres que el carrito siempre empiece vacío
    // al iniciar sesión, descomenta la siguiente línea:
    // this.cartService.clearCart();
  }

  /**
   * Remueve el token del almacenamiento local y limpia el estado del usuario.
   */
  private removeToken(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
  }

  /**
   * Envía una solicitud de registro al backend.
   * @param userData Los datos del nuevo usuario.
   * @returns Un Observable con la respuesta del backend.
   */
  register(userData: RegisterRequest): Observable<any> {
    return this.http.post(`${this.userApiUrl}/registro`, userData);
  }

  /**
   * Envía una solicitud de login al backend.
   * @param credentials Las credenciales del usuario (email y password).
   * @returns Un Observable con la respuesta del login (incluyendo el token).
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.userApiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.token) {
          this.saveToken(response.token); // Si hay token en la respuesta, guardarlo
        }
      })
    );
  }

  /**
   * Cierra la sesión del usuario, eliminando el token y limpiando el carrito.
   */
  logout(): void {
    this.removeToken();
    this.cartService.clearCart(); // Limpia el carrito al cerrar sesión
  }

  /**
   * Verifica si el usuario está logueado.
   * @returns True si el usuario está logueado, false en caso contrario.
   */
  public isLoggedIn(): boolean {
    return !!this.currentUserSubject.value; // Convierte el valor a booleano
  }

  /**
   * Verifica si el usuario actual tiene un rol específico.
   * @param role El rol a verificar (ej. 'ADMIN', 'USER').
   * @returns True si el usuario tiene el rol, false en caso contrario.
   */
  public hasRole(role: string): boolean {
    const currentUser = this.currentUserSubject.value;
    // Compara el rol ingresado (convertido a mayúsculas) con los roles del usuario
    return !!currentUser && currentUser.roles.includes(role.toUpperCase());
  }

  /**
   * Obtiene el ID del usuario actual.
   * @returns El ID del usuario o null si no hay usuario logueado.
   */
  public getCurrentUserId(): number | null {
    const currentUser = this.currentUserSubject.value;
    return currentUser ? currentUser.id : null;
  }
}

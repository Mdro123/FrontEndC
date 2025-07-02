// src/app/services/order.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { PedidoResponse } from '../models/order.model';

// --- Importar el archivo de entorno ---
import { environment } from '../../environments/environment.prod';
// ------------------------------------

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  // --- Usar la URL base del entorno ---
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/pedidos`;
  // ------------------------------------

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todos los pedidos (para administradores).
   * @returns Un Observable con una lista de PedidoResponse.
   */
  getAllOrders(): Observable<PedidoResponse[]> {
    console.log(`OrderService: Realizando GET a ${this.apiUrl} (getAllOrders)`);
    return this.http.get<PedidoResponse[]>(this.apiUrl).pipe(
      tap(response => {
        console.log('OrderService: Respuesta exitosa de todos los pedidos:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('OrderService: Error HTTP al obtener todos los pedidos:', error);
        let errorMessage = 'Ocurrió un error desconocido al obtener todos los pedidos.';
        if (error.error instanceof ErrorEvent) {
          errorMessage = `Error del cliente: ${error.error.message}`;
        } else {
          errorMessage = `Error del servidor: Código ${error.status}, mensaje: ${error.message}`;
          if (error.error && error.error.message) {
            errorMessage = `Error del servidor: ${error.error.message}`;
          }
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Obtiene los pedidos de un usuario específico.
   * @param userId El ID del usuario.
   * @returns Un Observable con una lista de PedidoResponse.
   */
  getOrdersByUserId(userId: number): Observable<PedidoResponse[]> {
    console.log(`OrderService: Realizando GET a ${this.apiUrl}/usuario/${userId}`);
    return this.http.get<PedidoResponse[]>(`${this.apiUrl}/usuario/${userId}`).pipe(
      tap(response => {
        console.log(`OrderService: Respuesta exitosa de pedidos para usuario ${userId}:`, response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error(`OrderService: Error HTTP al obtener pedidos para usuario ${userId}:`, error);
        let errorMessage = 'Ocurrió un error desconocido al obtener tus pedidos.';
        if (error.error instanceof ErrorEvent) {
          errorMessage = `Error del cliente: ${error.error.message}`;
        } else {
          errorMessage = `Error del servidor: Código ${error.status}, mensaje: ${error.message}`;
          if (error.error && error.error.message) {
            errorMessage = `Error del servidor: ${error.error.message}`;
          }
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Obtiene un pedido por su ID.
   * @param orderId El ID del pedido.
   * @returns Un Observable con el PedidoResponse.
   */
  getOrderById(orderId: number): Observable<PedidoResponse> {
    console.log(`OrderService: Realizando GET a ${this.apiUrl}/${orderId} (getOrderById)`);
    return this.http.get<PedidoResponse>(`${this.apiUrl}/${orderId}`).pipe(
      tap(response => {
        console.log(`OrderService: Respuesta exitosa de pedido ${orderId}:`, response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error(`OrderService: Error HTTP al obtener pedido ${orderId}:`, error);
        let errorMessage = 'Ocurrió un error desconocido al obtener el pedido.';
        if (error.error instanceof ErrorEvent) {
          errorMessage = `Error del cliente: ${error.error.message}`;
        } else {
          errorMessage = `Error del servidor: Código ${error.status}, mensaje: ${error.message}`;
          if (error.error && error.error.message) {
            errorMessage = `Error del servidor: ${error.error.message}`;
          }
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Actualiza el estado de un pedido en el backend (solo para administradores).
   * @param orderId El ID del pedido a actualizar.
   * @param newStatus El nuevo estado del pedido (string, ej. 'procesado').
   * @param adminUserId El ID del usuario administrador que realiza la acción (se usa en el backend para historial).
   * @returns Un Observable con el PedidoResponse actualizado.
   */
  updateOrderStatus(orderId: number, newStatus: string, adminUserId: number): Observable<PedidoResponse> {
    console.log(`OrderService: Realizando PUT a ${this.apiUrl}/${orderId}/estado con estado ${newStatus} por admin ${adminUserId}`);
    return this.http.put<PedidoResponse>(`${this.apiUrl}/${orderId}/estado?nuevoEstadoString=${newStatus}`, {}).pipe(
      tap(response => {
        console.log(`OrderService: Respuesta exitosa de actualización de estado para pedido ${orderId}:`, response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error(`OrderService: Error HTTP al actualizar estado de pedido ${orderId}:`, error);
        let errorMessage = 'Ocurrió un error desconocido al actualizar el estado del pedido.';
        if (error.error instanceof ErrorEvent) {
          errorMessage = `Error del cliente: ${error.error.message}`;
        } else {
          errorMessage = `Error del servidor: Código ${error.status}, mensaje: ${error.message}`;
          if (error.error && error.error.message) {
            errorMessage = `Error del servidor: ${error.error.message}`;
          }
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}

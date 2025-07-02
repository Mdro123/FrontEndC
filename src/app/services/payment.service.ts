// src/app/services/payment.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ConfirmarCompraRequest, PedidoResponse } from '../models/order.model';

// --- Importar el archivo de entorno ---
import { environment } from '../../environments/environment.prod';
// ------------------------------------

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  // --- Usar la URL base del entorno ---
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/pedidos`; // Asumo que el endpoint de pago está bajo /api/pedidos
  // ------------------------------------

  constructor(private http: HttpClient) { }

  confirmPurchase(orderRequest: ConfirmarCompraRequest): Observable<PedidoResponse | null> {
    const confirmPurchaseUrl = `${this.apiUrl}/confirmar`;

    return this.http.post<PedidoResponse>(confirmPurchaseUrl, orderRequest)
      .pipe(
        map(response => response),
        catchError(error => {
          console.error('Error durante la confirmación de compra:', error);
          return of(null);
        })
      );
  }
}

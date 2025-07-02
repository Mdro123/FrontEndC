import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { Observable, Subscription, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { OrderService } from '../../../services/order.service';
import { AuthService } from '../../../services/auth.service';
import { PedidoResponse } from '../../../models/order.model';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.css']
})
export class MyOrdersComponent implements OnInit, OnDestroy {
  orders$: Observable<PedidoResponse[]> | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  private authSubscription!: Subscription;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.authSubscription = this.authService.currentUser.subscribe(user => {
      if (user && user.id !== -1) {
        this.loadUserOrders();
      } else {
        this.errorMessage = 'No se pudo obtener tu ID de usuario. Por favor, inicia sesión de nuevo.';
        this.isLoading = false;
        this.orders$ = of([]);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  loadUserOrders(): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId || userId === -1) {
      this.errorMessage = 'ID de usuario no válido.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.orders$ = this.orderService.getOrdersByUserId(userId).pipe(
      map(orders => orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())),
      catchError(error => {
        this.errorMessage = 'Hubo un error al cargar tus pedidos. Inténtalo de nuevo más tarde.';
        this.snackBar.open('Error al cargar pedidos.', 'Cerrar', { duration: 3000 });
        return of([]);
      })
    );
    this.orders$.subscribe(() => this.isLoading = false);
  }

  getEstadoLegible(estado: string): string {
    const estados: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'procesado': 'Procesado',
      'enviado': 'Enviado',
      'entregado': 'Entregado',
      'cancelado_cliente': 'Cancelado por Cliente',
      'cancelado_sistema': 'Cancelado por Sistema',
      'pago_fallido': 'Pago Fallido'
    };
    return estados[estado] || estado;
  }
}

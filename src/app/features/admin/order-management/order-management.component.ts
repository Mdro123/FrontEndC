import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';

// ¡IMPORTACIONES NECESARIAS PARA LAS ANIMACIONES!
import { animate, state, style, transition, trigger } from '@angular/animations'; // <-- Añade esta línea

import { OrderService } from '../../../services/order.service';
import { PedidoResponse } from '../../../models/order.model';
import { AuthService } from '../../../services/auth.service';

import { of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    FormsModule,
    MatCardModule,
    MatSelectModule,
    MatExpansionModule,
    MatDividerModule,
    CurrencyPipe,
    DatePipe
  ],
  // ¡AÑADE EL BLOQUE DE ANIMACIONES AQUÍ!
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*', overflow: 'hidden'})), // Añadir overflow: hidden para evitar barras de scroll temporales
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.css']
})
export class OrderManagementComponent implements OnInit {

  displayedColumns: string[] = ['id', 'usuario', 'total', 'estado', 'fecha', 'acciones'];
  dataSource: MatTableDataSource<PedidoResponse> = new MatTableDataSource<PedidoResponse>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading: boolean = true;
  errorMessage: string | null = null;

  // ¡DECLARA LA PROPIEDAD expandedElement AQUÍ!
  expandedElement: PedidoResponse | null = null; // Para controlar la fila expandida

  estadosPedidoOptions: string[] = [
    'pendiente',
    'procesado',
    'enviado',
    'entregado',
    'cancelado_cliente',
    'cancelado_sistema',
    'pago_fallido'
  ];

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  // Si tienes un ngAfterViewInit, asegúrate de que esté correctamente implementado.
  // Si no tienes lógica adicional, no es estrictamente necesario, pero no causa daño.
  ngAfterViewInit() {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.orderService.getAllOrders().pipe(
      tap(() => this.isLoading = false),
      catchError((error: any) => {
        console.error('Error al cargar pedidos:', error);
        this.errorMessage = 'No se pudieron cargar los pedidos. Intenta de nuevo más tarde.';
        this.isLoading = false;
        return of([]);
      })
    ).subscribe((orders: PedidoResponse[]) => {
      this.dataSource = new MatTableDataSource<PedidoResponse>(orders);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  updateOrderStatus(orderId: number, newStatus: string): void {
    const adminUserId = this.authService.getCurrentUserId();
    if (!adminUserId) {
      this.snackBar.open('Error: ID de administrador no disponible. Por favor, inicia sesión de nuevo.', 'Cerrar', { duration: 5000, panelClass: ['snackbar-error'] });
      return;
    }

    if (confirm(`¿Estás seguro de que quieres cambiar el estado del pedido ${orderId} a "${this.getEstadoLegible(newStatus)}"?`)) {
      this.orderService.updateOrderStatus(orderId, newStatus, adminUserId).subscribe({
        next: (updatedOrder: PedidoResponse) => {
          this.snackBar.open(`Estado del pedido #${updatedOrder.id} actualizado a "${this.getEstadoLegible(updatedOrder.estado)}".`, 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
          this.loadOrders();
        },
        error: (error: any) => {
          const message = error.error?.message || 'Error al actualizar el estado del pedido. Intenta de nuevo.';
          this.snackBar.open(message, 'Cerrar', { duration: 5000, panelClass: ['snackbar-error'] });
          console.error('Error al actualizar estado de pedido:', error);
        }
      });
    }
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'procesado':
      case 'enviado':
      case 'entregado':
        return 'status-success';
      case 'pendiente':
        return 'status-pending';
      case 'pago_fallido':
      case 'cancelado_cliente':
      case 'cancelado_sistema':
        return 'status-failed';
      default:
        return '';
    }
  }
}

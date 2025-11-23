import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; // IMPORTANTE: Importar RouterLink
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule, MatSnackBarConfig } from '@angular/material/snack-bar';

import { CartService } from '../../../services/cart.service';
import { CartItem } from '../../../models/product.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    RouterLink // IMPORTANTE: Añadir RouterLink a los imports
  ],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cartItems$: Observable<CartItem[]>;
  cartSubtotal$: Observable<number>;
  cartItemCount$: Observable<number>;

  constructor(
    public cartService: CartService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.cartItems$ = this.cartService.cart$;
    this.cartSubtotal$ = this.cartService.getCartSubtotal();
    this.cartItemCount$ = this.cartService.getCartItemCount();
  }

  ngOnInit(): void {
    this.cartService.validateCartWithBackend().subscribe({
      next: (response) => {
        if (!response.carritoCompletoValido) {
          console.warn('El carrito no es completamente válido según el backend.');
        }
      },
      error: (err) => {
        console.error('Error al validar el carrito al inicio:', err);
      }
    });
  }

  updateQuantity(item: CartItem, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    let newQuantity = parseInt(inputElement.value, 10);

    if (isNaN(newQuantity)) {
        newQuantity = 1;
        inputElement.value = newQuantity.toString();
    }
    this.cartService.updateItemQuantity(item.id, newQuantity);
  }

  // --- ELIMINAR ITEM (SILENCIOSO) ---
  removeItem(productId: number): void {
    this.cartService.removeItem(productId);
    // Se eliminó la línea this.snackBar.open(...)
  }

  // --- VACIAR CARRITO (CONFIRMACIÓN CENTRADA) ---
  confirmClearCart(): void {
    // Configuración para que parezca una alerta en el medio
    const config: MatSnackBarConfig = {
      duration: 5000, // 5 segundos para decidir
      verticalPosition: 'top', // Arriba (Angular Material no soporta 'center' vertical fácilmente, Top + CSS es lo mejor)
      horizontalPosition: 'center', // Centrado horizontal
      panelClass: ['confirmation-toast'] // Clase CSS personalizada (blanco/rojo)
    };

    const snackBarRef = this.snackBar.open('¿Estás seguro de vaciar todo el carrito?', 'SÍ, VACIAR', config);

    snackBarRef.onAction().subscribe(() => {
      this.cartService.clearCart();
      // NO mostramos mensaje posterior ("Carrito vaciado"), simplemente se vacía.
    });
  }

  proceedToCheckout(): void {
    this.cartService.validateCartWithBackend().pipe(take(1)).subscribe({
      next: (response) => {
        if (response.carritoCompletoValido) {
          if (this.cartService.currentCartValue.length > 0) {
            this.router.navigate(['/checkout']);
          } else {
            this.snackBar.open('Tu carrito está vacío. Añade productos para proceder.', 'Ok', { duration: 3000 });
          }
        } else {
          this.snackBar.open('Por favor, resuelve los problemas en tu carrito antes de proceder.', 'Cerrar', { duration: 5000, panelClass: ['snackbar-error'] });
        }
      },
      error: (err) => {
        console.error('Error durante la validación previa al checkout:', err);
      }
    });
  }
}

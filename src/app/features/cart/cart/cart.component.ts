import { Component, OnInit } from '@angular/core'; // Añade OnInit
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

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
    MatSnackBarModule
  ],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit { // Implementa OnInit
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
    // Valida el carrito con el backend al cargar la página del carrito
    this.cartService.validateCartWithBackend().subscribe({
      next: (response) => {
        if (!response.carritoCompletoValido) {
          // El CartService ya muestra los snackbars de advertencia
          console.warn('El carrito no es completamente válido según el backend.');
        }
      },
      error: (err) => {
        // El CartService ya muestra el snackbar de error
        console.error('Error al validar el carrito al inicio:', err);
      }
    });
  }

  /**
   * Actualiza la cantidad de un producto en el carrito, delegando al CartService.
   */
  updateQuantity(item: CartItem, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    let newQuantity = parseInt(inputElement.value, 10);

    // Si la cantidad es inválida o negativa, la forzamos a 1 (o 0 para eliminar)
    if (isNaN(newQuantity)) {
        newQuantity = 1;
        inputElement.value = newQuantity.toString();
    }
    // No necesitamos la validación de stock aquí, el servicio lo hará con el backend
    // y el snackbar ya se mostrará desde el servicio.
    this.cartService.updateItemQuantity(item.id, newQuantity);
  }

  /**
   * Elimina un producto del carrito.
   */
  removeItem(productId: number): void {
    this.cartService.removeItem(productId);
    this.snackBar.open('Producto eliminado del carrito.', 'Ok', { duration: 2000 });
  }

  /**
   * Pide confirmación y vacía el carrito por completo.
   */
  confirmClearCart(): void {
    const snackBarRef = this.snackBar.open('¿Estás seguro de que quieres vaciar el carrito?', 'Sí, Vaciar', { duration: 5000 });

    snackBarRef.onAction().subscribe(() => {
      this.cartService.clearCart();
      this.snackBar.open('Carrito vaciado.', 'Ok', { duration: 2000 });
    });
  }

  /**
   * Navega a la página de checkout si el carrito no está vacío, previa validación.
   */
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
          this.snackBar.open('Por favor, resuelve los problemas en tu carrito antes de proceder (stock, precios).', 'Cerrar', { duration: 5000, panelClass: ['snackbar-error'] });
        }
      },
      error: (err) => {
        // Error ya manejado y mostrado por validateCartWithBackend
        console.error('Error durante la validación previa al checkout:', err);
      }
    });
  }
}

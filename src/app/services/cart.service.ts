// src/app/services/cart.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import { CartItem, Product } from '../models/product.model';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CarritoValidacionResponse, ItemValidado } from '../models/cart-validation.model';

// --- Importar el archivo de entorno ---
import { environment } from '../../environments/environment.prod';
// ------------------------------------

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartKey = 'shopping_cart';
  // --- Usar la URL base del entorno ---
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/carrito`; // Endpoint de tu CarritoController
  // ------------------------------------

  private cartSubject: BehaviorSubject<CartItem[]>;
  public cart$: Observable<CartItem[]>;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    const initialCart = this.getCartFromLocalStorage();
    this.cartSubject = new BehaviorSubject<CartItem[]>(initialCart);
    this.cart$ = this.cartSubject.asObservable();
  }

  private getCartFromLocalStorage(): CartItem[] {
    try {
      const cartJson = localStorage.getItem(this.cartKey);
      return cartJson ? JSON.parse(cartJson) : [];
    } catch (e) {
      console.error('Error al cargar el carrito de localStorage:', e);
      return [];
    }
  }

  private saveCartToLocalStorage(cart: CartItem[]): void {
    localStorage.setItem(this.cartKey, JSON.stringify(cart));
  }

  private updateCart(cart: CartItem[]): void {
    this.cartSubject.next(cart);
    this.saveCartToLocalStorage(cart);
  }

  get currentCartValue(): CartItem[] {
    return this.cartSubject.value;
  }

  /**
   * Valida el carrito actual del frontend con el backend y actualiza el carrito local.
   * Muestra mensajes de error si hay problemas de stock o precio.
   * @returns Observable<CarritoValidacionResponse>
   */
  validateCartWithBackend(): Observable<CarritoValidacionResponse> {
    const itemsToValidate = this.currentCartValue.map(item => ({
      productId: item.id,
      cantidad: item.quantity
    }));

    return this.http.post<CarritoValidacionResponse>(`${this.apiUrl}/validar`, { items: itemsToValidate }).pipe(
      tap(response => {
        let newCart: CartItem[] = [];
        let needsUpdate = false;

        response.itemsValidados.forEach(validatedItem => {
          const originalItem = this.currentCartValue.find(ci => ci.id === validatedItem.productId);

          if (validatedItem.valido && originalItem) {
            const updatedItem: CartItem = {
              ...originalItem,
              precio: validatedItem.precioUnitario,
              stock: validatedItem.cantidadDisponible,
              quantity: validatedItem.cantidadSolicitada
            };
            newCart.push(updatedItem);
          } else if (!validatedItem.valido && originalItem) {
            this.snackBar.open(`¡Atención! ${validatedItem.titulo}: ${validatedItem.mensaje}`, 'Cerrar', { duration: 5000, panelClass: ['snackbar-warn'] });

            if (validatedItem.cantidadDisponible === 0) {
              needsUpdate = true;
            } else {
              if (originalItem.quantity > validatedItem.cantidadDisponible) {
                originalItem.quantity = validatedItem.cantidadDisponible;
                newCart.push(originalItem);
                needsUpdate = true;
              } else {
                  newCart.push({
                   ...originalItem,
                   precio: validatedItem.precioUnitario,
                   stock: validatedItem.cantidadDisponible,
                   quantity: validatedItem.cantidadSolicitada
                  });
                  needsUpdate = true;
              }
            }
          } else if (!validatedItem.valido && !originalItem) {
             console.warn('Backend validó un ítem no presente en el carrito local:', validatedItem);
          }
        });

        const finalCart = newCart.filter(item => item.quantity > 0);

        if (needsUpdate || finalCart.length !== this.currentCartValue.length) {
            this.updateCart(finalCart);
        }
      }),
      catchError(error => {
        console.error('Error de validación del carrito con el backend:', error);
        this.snackBar.open('Error al validar el carrito con el servidor. Inténtalo de nuevo.', 'Cerrar', { duration: 5000, panelClass: ['snackbar-error'] });
        return throwError(() => new Error('Error al validar el carrito.'));
      })
    );
  }

  /**
   * Añade un producto al carrito, validando con el backend.
   * @param product El producto a añadir.
   * @param quantity La cantidad a añadir.
   * @returns Observable<void> que indica éxito o fallo.
   */
  addToCart(product: Product, quantity: number = 1): Observable<void> {
    const currentCart = this.currentCartValue;
    const existingItem = currentCart.find(item => item.id === product.id);

    let tempCartItems: { productId: number, cantidad: number }[] = [];

    if (existingItem) {
      tempCartItems = currentCart.map(item => ({
        productId: item.id,
        cantidad: item.id === product.id ? item.quantity + quantity : item.quantity
      }));
    } else {
      tempCartItems = [...currentCart.map(item => ({ productId: item.id, cantidad: item.quantity })), { productId: product.id, cantidad: quantity }];
    }

    return this.http.post<CarritoValidacionResponse>(`${this.apiUrl}/validar`, { items: tempCartItems }).pipe(
      tap(response => {
        const validatedItem = response.itemsValidados.find(item => item.productId === product.id);

        if (validatedItem && validatedItem.valido) {
          let newCart: CartItem[] = [];
          if (existingItem) {
            newCart = currentCart.map(item =>
              item.id === product.id ? { ...item, quantity: validatedItem.cantidadSolicitada, precio: validatedItem.precioUnitario, stock: validatedItem.cantidadDisponible } : item
            );
          } else {
            newCart = [...currentCart, { ...product, quantity: validatedItem.cantidadSolicitada, precio: validatedItem.precioUnitario, stock: validatedItem.cantidadDisponible }];
          }
          this.updateCart(newCart);
          this.snackBar.open(`"${product.titulo}" añadido al carrito.`, 'Ok', { duration: 2000, panelClass: ['snackbar-success'] });
        } else if (validatedItem && !validatedItem.valido) {
          this.snackBar.open(`¡Error! "${product.titulo}": ${validatedItem.mensaje}`, 'Cerrar', { duration: 4000, panelClass: ['snackbar-error'] });
          throw new Error(validatedItem.mensaje);
        } else {
          this.snackBar.open(`Error desconocido al añadir "${product.titulo}".`, 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
          throw new Error('Error de validación desconocido.');
        }
      }),
      map(() => void 0),
      catchError(error => {
        console.error('Error al añadir producto al carrito:', error);
        if (!this.snackBar._openedSnackBarRef) {
            this.snackBar.open('Error al añadir al carrito. Inténtalo de nuevo.', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
        }
        return throwError(() => error);
      })
    );
  }

  updateItemQuantity(productId: number, quantity: number): void {
    const currentCart = this.currentCartValue;
    const itemToUpdate = currentCart.find(item => item.id === productId);

    if (!itemToUpdate) {
        console.warn('Intento de actualizar cantidad de un producto no existente en el carrito.');
        return;
    }

    if (quantity <= 0) {
        this.removeItem(productId);
        this.snackBar.open('Producto eliminado del carrito.', 'Ok', { duration: 2000 });
        return;
    }

    const itemsForValidation = currentCart.map(item => ({
        productId: item.id,
        cantidad: item.id === productId ? quantity : item.quantity
    }));

    this.http.post<CarritoValidacionResponse>(`${this.apiUrl}/validar`, { items: itemsForValidation }).pipe(
        tap(response => {
            const validatedItem = response.itemsValidados.find(item => item.productId === productId);

            if (validatedItem && validatedItem.valido) {
                const newCart = currentCart.map(item =>
                    item.id === productId ? { ...item, quantity: validatedItem.cantidadSolicitada, precio: validatedItem.precioUnitario, stock: validatedItem.cantidadDisponible } : item
                );
                this.updateCart(newCart);
                this.snackBar.open(`Cantidad de "${validatedItem.titulo}" actualizada.`, 'Ok', { duration: 2000, panelClass: ['snackbar-success'] });
            } else if (validatedItem && !validatedItem.valido) {
                this.snackBar.open(`¡Error! "${validatedItem.titulo}": ${validatedItem.mensaje}`, 'Cerrar', { duration: 4000, panelClass: ['snackbar-error'] });
            } else {
                this.snackBar.open(`Error desconocido al actualizar cantidad de "${itemToUpdate.titulo}".`, 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
            }
        }),
        catchError(error => {
            console.error('Error al validar la cantidad con el backend:', error);
            this.snackBar.open('Error al actualizar la cantidad. Inténtalo de nuevo.', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
            return throwError(() => error);
        })
    ).subscribe();
  }

  removeItem(productId: number): void {
    const currentCart = this.currentCartValue.filter(item => item.id !== productId);
    this.updateCart(currentCart);
  }

  clearCart(): void {
    this.updateCart([]);
  }

  getCartItemCount(): Observable<number> {
    return this.cart$.pipe(
      map(items => items.reduce((count, item) => count + item.quantity, 0))
    );
  }

  getCartSubtotal(): Observable<number> {
    return this.cart$.pipe(
      map(items => items.reduce((total, item) => total + (item.precio * item.quantity), 0))
    );
  }
}

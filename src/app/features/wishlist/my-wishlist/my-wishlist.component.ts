import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { WishlistService } from '../../../services/wishlist.service';
import { CartService } from '../../../services/cart.service';
import { WishlistItem } from '../../../models/wishlist.model';

@Component({
  selector: 'app-my-wishlist',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, 
    CurrencyPipe, MatTooltipModule
  ],
  templateUrl: './my-wishlist.component.html',
  styleUrls: ['./my-wishlist.component.css']
})
export class MyWishlistComponent implements OnInit {
  wishlistItems: WishlistItem[] = [];
  isLoading: boolean = true;

  constructor(
    private wishlistService: WishlistService,
    private cartService: CartService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  loadWishlist(): void {
    this.isLoading = true;
    this.wishlistService.getMyWishlist().subscribe({
      next: (items) => {
        this.wishlistItems = items;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar lista de deseos', err);
        this.isLoading = false;
      }
    });
  }

  // --- Eliminar (Silencioso) ---
  removeItem(productId: number): void {
    this.wishlistService.removeFromWishlist(productId).subscribe({
      next: () => {
        this.wishlistItems = this.wishlistItems.filter(item => item.productoId !== productId);
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Error al eliminar el libro.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // --- AÑADIR AL CARRITO (UX MEJORADO: Scroll + Focus + Sin Mensaje) ---
  addToCartFromWishlist(item: WishlistItem): void {
    // 1. Crear objeto compatible
    const productMock: any = {
      id: item.productoId,
      titulo: item.titulo,
      precio: item.precio,
      imagenUrl: item.imagenUrl,
      autor: item.autor,
      stock: 10,
      categoria: { nombre: 'General' },
      sinopsis: ''
    };

    // 2. Llamar al servicio
    // Parámetros: (Producto, Cantidad, MostrarMensaje)
    // Pasamos 1 como cantidad y 'false' para ocultar el SnackBar negro
    this.cartService.addToCart(productMock, 1, false).subscribe({
      next: () => {
        
        // A. Scroll suave al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // B. Enfocar carrito
        setTimeout(() => {
          const cartButton = document.querySelector('button[routerLink="/carrito"]') as HTMLElement;
          if (cartButton) {
            cartButton.focus(); // Resalta el botón (anillo de foco)
          }
        }, 300);
      },
      error: (err) => {
        console.error('Error al añadir al carrito', err);
        this.snackBar.open('Error al añadir al carrito.', 'Cerrar', { duration: 3000 });
      }
    });
  }
}

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

  // Eliminar (Silencioso)
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

  // --- AÑADIR CON SCROLL Y FOCO ---
  addToCartFromWishlist(item: WishlistItem): void {
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

    this.cartService.addToCart(productMock).subscribe({
      next: () => {
        // 1. Ya NO mostramos el SnackBar.
        
        // 2. Scroll suave hacia arriba
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // 3. Enfocar el botón del carrito
        // Usamos un pequeño Timeout para dar tiempo a que empiece el scroll
        setTimeout(() => {
          // Buscamos el botón por su atributo routerLink="/carrito" que definiste en el Navbar
          const cartButton = document.querySelector('button[routerLink="/carrito"]') as HTMLElement;
          if (cartButton) {
            cartButton.focus(); // Esto pone el "anillo" de selección (Tab)
          }
        }, 100);
      },
      error: (err) => {
        console.error('Error al añadir al carrito', err);
        this.snackBar.open('Error al añadir al carrito.', 'Cerrar', { duration: 3000 });
      }
    });
  }
}

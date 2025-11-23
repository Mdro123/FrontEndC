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
        // Actualizamos la lista visualmente
        this.wishlistItems = this.wishlistItems.filter(item => item.productoId !== productId);
        // NO mostramos mensaje de éxito (silencioso)
      },
      error: (err) => {
        // SÍ mostramos mensaje si hay un error
        console.error(err);
        this.snackBar.open('Error al eliminar el libro.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // --- Añadir al Carrito (Silencioso y funcional) ---
  addToCartFromWishlist(item: WishlistItem): void {
    // Creamos un objeto compatible con Product para que el carrito lo acepte
    // Usamos 'any' o ajustamos al modelo Product según tu proyecto
    const productMock: any = {
      id: item.productoId,
      titulo: item.titulo,
      precio: item.precio,
      imagenUrl: item.imagenUrl,
      autor: item.autor,
      // Campos obligatorios que quizás no vienen en WishlistItem:
      stock: 10, // Asumimos stock para permitir la acción
      categoria: { nombre: 'General' },
      sinopsis: ''
    };

    this.cartService.addToCart(productMock).subscribe({
      next: () => {
        // Éxito: No mostramos mensaje (silencioso)
        // Opcional: Si quieres que al añadir al carrito SE BORRE de la lista, descomenta esto:
        // this.removeItem(item.productoId);
      },
      error: (err) => {
        console.error('Error al añadir al carrito', err);
        this.snackBar.open('Error al añadir al carrito.', 'Cerrar', { duration: 3000 });
      }
    });
  }
}

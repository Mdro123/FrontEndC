import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WishlistService } from '../../../services/wishlist.service';
import { CartService } from '../../../services/cart.service'; // Para añadir al carrito desde la lista
import { WishlistItem } from '../../../models/wishlist.model';
import { Product } from '../../../models/product.model'; // Necesario para convertir el ítem al añadir al carrito

@Component({
  selector: 'app-my-wishlist',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, CurrencyPipe
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

  removeItem(productId: number): void {
    this.wishlistService.removeFromWishlist(productId).subscribe({
      next: () => {
        this.snackBar.open('Producto eliminado de la lista.', 'Cerrar', { duration: 3000 });
        // Recargamos la lista localmente filtrando el ítem eliminado
        this.wishlistItems = this.wishlistItems.filter(item => item.productoId !== productId);
      },
      error: (err) => {
        this.snackBar.open('Error al eliminar el producto.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // Método auxiliar para convertir WishlistItem a Product y añadirlo al carrito
  addToCartFromWishlist(item: WishlistItem): void {
    // Creamos un objeto parcial compatible con Product para el carrito
    // Nota: El carrito necesita 'id', 'titulo', 'precio', 'imagenUrl', etc.
    const productMock: any = {
      id: item.productoId,
      titulo: item.titulo,
      precio: item.precio,
      imagenUrl: item.imagenUrl,
      autor: item.autor,
      stock: 10 // Asumimos stock disponible o el backend validará al comprar
    };

    this.cartService.addToCart(productMock);
  }
}

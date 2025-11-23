import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE';
import { ActivatedRoute, RouterLink, Router } from '@angular/router'; 
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../models/product.model';
import { Observable, switchMap, of, tap, catchError } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; 
import { MatTooltipModule } from '@angular/material/tooltip'; 
import { CartService } from '../../../services/cart.service';
import { ChatbotService } from '../../../services/chatbot.service';
import { WishlistService } from '../../../services/wishlist.service'; 

registerLocaleData(localeEsPe, 'es-PE');

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule
  ],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  product$: Observable<Product | null> | null = null;
  loading: boolean = true;
  errorMessage: string | null = null;
  
  isInWishlist: boolean = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    public chatbotService: ChatbotService,
    private wishlistService: WishlistService, 
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.product$ = this.activatedRoute.paramMap.pipe(
      tap(() => { this.loading = true; this.errorMessage = null; }),
      switchMap(params => {
        const productId = params.get('id');
        if (productId) {
          return this.productService.getProductById(parseInt(productId, 10));
        } else {
          this.errorMessage = 'ID de producto no encontrado.';
          return of(null);
        }
      }),
      tap(product => {
        this.loading = false;
        if (!product) {
          this.errorMessage = 'Libro no encontrado.';
        } else {
          this.checkWishlistStatus(product.id);
        }
      }),
      catchError((err: any) => {
        this.loading = false;
        this.errorMessage = 'Error al cargar los detalles del libro.';
        console.error('Error fetching product details:', err);
        return of(null);
      })
    );
  }

  checkWishlistStatus(productId: number): void {
    this.wishlistService.getMyWishlist().subscribe({
      next: (items) => {
        this.isInWishlist = items.some(item => item.productoId === productId);
      },
      error: () => {
        this.isInWishlist = false;
      }
    });
  }

  toggleWishlist(product: Product): void {
    if (this.isInWishlist) {
      // Eliminar (se queda en la misma página)
      this.wishlistService.removeFromWishlist(product.id).subscribe({
        next: () => {
          this.isInWishlist = false; 
          this.snackBar.open('Eliminado de tu lista de deseos', 'Cerrar', { duration: 2000 });
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Error al eliminar de favoritos', 'Cerrar', { duration: 3000 });
        }
      });
    } else {
      // Agregar (Redirecciona a la lista de deseos)
      this.wishlistService.addToWishlist(product.id).subscribe({
        next: () => {
          this.isInWishlist = true; 
          this.router.navigate(['/mi-lista-deseos']);
        },
        error: (err) => {
          if (err.status === 403) {
             this.snackBar.open('Inicia sesión para guardar favoritos.', 'Cerrar', { duration: 4000 });
          } else {
             const msg = err.error || 'Error al añadir a favoritos.';
             this.snackBar.open(msg, 'Cerrar', { duration: 3000 });
          }
        }
      });
    }
  }

  // --- MÉTODO MODIFICADO: AÑADIR AL CARRITO ---
  addToCart(product: Product): void {
    // Parámetros: Producto, Cantidad (1), MostrarMensaje (false)
    this.cartService.addToCart(product, 1, false).subscribe({
      next: () => {
        // Éxito silencioso -> Redireccionar al Carrito
        this.router.navigate(['/carrito']);
      },
      error: (err) => {
        console.error('Error al añadir al carrito:', err);
        // Si hay error, sí mostramos el mensaje para avisar
        this.snackBar.open('Error al añadir al carrito.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  speakProductDetails(product: Product): void {
    if (!product) return;

    if (this.chatbotService.isSpeaking) {
      this.chatbotService.stopSpeaking();
    } else {
      const pipe = new CurrencyPipe('es-PE');
      const formattedPrice = pipe.transform(product.precio, 'S/.', 'symbol', '1.2-2');
      
      const fullText = `
        Título: ${product.titulo}.
        Autor: ${product.autor}.
        Precio: ${formattedPrice}.
        Sinopsis: ${product.sinopsis || 'No disponible.'}
      `;
      
      this.chatbotService.speak(fullText);
    }
  }
}

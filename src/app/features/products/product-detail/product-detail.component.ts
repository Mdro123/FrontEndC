import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../models/product.model';
import { Observable, switchMap, of, tap, catchError } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Importar SnackBar
import { MatTooltipModule } from '@angular/material/tooltip'; // Importar Tooltip
import { CartService } from '../../../services/cart.service';
import { ChatbotService } from '../../../services/chatbot.service';
import { WishlistService } from '../../../services/wishlist.service'; // Importar WishlistService

// Registrar el local para Perú
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

  constructor(
    private activatedRoute: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    public chatbotService: ChatbotService,
    private wishlistService: WishlistService, // Inyectar WishlistService
    private snackBar: MatSnackBar // Inyectar SnackBar
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

  // --- Método para añadir al carrito (CORREGIDO) ---
  addToCart(product: Product): void {
    this.cartService.addToCart(product).subscribe({
      next: () => {
        // El éxito se maneja en el servicio (SnackBar) si está configurado allí,
        // o puedes añadir tu propio mensaje aquí.
      },
      error: (err) => {
        console.error('Error al añadir al carrito desde detalle:', err);
        this.snackBar.open('Error al añadir al carrito.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // --- Método para añadir a la lista de deseos (RECUPERADO) ---
  addToWishlist(product: Product): void {
    this.wishlistService.addToWishlist(product.id).subscribe({
      next: () => {
        this.snackBar.open(`¡"${product.titulo}" añadido a tu lista de deseos!`, 'Cerrar', { 
          duration: 3000, 
          panelClass: ['snackbar-success'] 
        });
      },
      error: (err) => {
        if (err.status === 403) {
           this.snackBar.open('Debes iniciar sesión para guardar favoritos.', 'Cerrar', { duration: 4000 });
        } else {
           const msg = err.error || 'El libro ya está en tu lista o hubo un error.';
           this.snackBar.open(msg, 'Cerrar', { duration: 3000 });
        }
      }
    });
  }

  // --- Método de accesibilidad (Voz) (CORREGIDO) ---
  speakProductDetails(product: Product): void {
    if (!product) return;

    if (this.chatbotService.isSpeaking) {
      this.chatbotService.stopSpeaking();
    } else {
      // Instancia manual para evitar el error de inyección
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

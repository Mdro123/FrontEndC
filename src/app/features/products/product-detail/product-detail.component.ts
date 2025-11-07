import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../models/product.model';
import { Observable, switchMap, of, tap, catchError } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CartService } from '../../../services/cart.service';
import { ChatbotService } from '../../../services/chatbot.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatCardModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, CurrencyPipe // Está bien aquí (para el HTML)
  ],
  // --- LÍNEA DE CORRECCIÓN AÑADIDA AQUÍ ---
  providers: [CurrencyPipe], // Esto permite inyectarlo en el constructor
  // ------------------------------------
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
    private currencyPipe: CurrencyPipe // Ahora esto funcionará
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

  addToCart(product: Product): void {
    this.cartService.addToCart(product);
  }

  speakProductDetails(product: Product): void {
    if (!product) return;

    if (this.chatbotService.isSpeaking) {
      this.chatbotService.stopSpeaking();
    } else {
      // 1. Formatear el precio usando el CurrencyPipe inyectado
      const formattedPrice = this.currencyPipe.transform(product.precio, 'S/.', 'symbol', '1.2-2', 'es-PE');
      
      // 2. Construir el texto completo
      const fullText = `
        Título: ${product.titulo}.
        Autor: ${product.autor}.
        Precio: ${formattedPrice}.
        Sinopsis: ${product.sinopsis || 'No disponible.'}
      `;
      
      // 3. Llamar al servicio de voz
      this.chatbotService.speak(fullText);
    }
  }
}

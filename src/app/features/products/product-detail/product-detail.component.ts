import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { Product } from '../../../models/product.model';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // <--- Importa MatSnackBarModule aquí también

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CurrencyPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule // <--- ¡CAMBIA ESTO A MatSnackBarModule!
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
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.product$ = this.activatedRoute.paramMap.pipe(
      switchMap(params => {
        this.loading = true;
        this.errorMessage = null;
        const productId = params.get('id');
        if (productId) {
          return this.productService.getProductById(parseInt(productId, 10));
        }
        this.errorMessage = 'ID de producto no encontrado.';
        this.loading = false;
        return of(null);
      })
    );

    this.product$.subscribe({
      next: (product) => {
        this.loading = false;
        if (!product) {
          this.errorMessage = 'Libro no encontrado.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Error al cargar los detalles del libro.';
      }
    });
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product).subscribe({
      next: () => {
        // El snackbar ya se muestra en cart.service
      },
      error: (err) => {
        // El snackbar ya se muestra en cart.service para errores de stock/validación
        console.error('Error al añadir producto desde ProductDetail:', err);
      }
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, UpperCasePipe } from '@angular/common';
import { ProductService } from '../../../services/product.service';
import { Product, ProductoMasVendidoDTO } from '../../../models/product.model';
import { Observable, Subject, of } from 'rxjs';
import { switchMap, debounceTime, distinctUntilChanged, catchError, take } from 'rxjs/operators';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CartService } from '../../../services/cart.service';
import { CategoryService } from '../../../services/category.service';
import { Category } from '../../../models/category.model';
import { MatSnackBar } from '@angular/material/snack-bar'; // Import MatSnackBar

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule, MatCardModule, MatButtonModule,
    MatProgressSpinnerModule, MatInputModule, MatFormFieldModule, MatIconModule,
    CurrencyPipe, MatToolbarModule, UpperCasePipe
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  products$: Observable<Product[]> | null = null;
  categories$: Observable<Category[]> | null = null;
  errorMessage: string | null = null;
  searchTerm: string = '';
  private searchSubject = new Subject<string>();

  topSellingProducts$: Observable<ProductoMasVendidoDTO[]> | null = null;

  constructor(
    private productService: ProductService,
    private activatedRoute: ActivatedRoute,
    private cartService: CartService,
    private categoryService: CategoryService,
    private router: Router,
    private snackBar: MatSnackBar // Inyecta MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.setupProductLoading();
    this.setupSearch();
    this.loadTopSellingProducts();
  }

  loadCategories(): void {
    this.categories$ = this.categoryService.getAllCategories().pipe(
      catchError(error => {
        console.error('Error al cargar categorías:', error);
        return of([]);
      })
    );
  }

  setupProductLoading(): void {
    this.activatedRoute.queryParamMap.pipe(
      switchMap(queryParams => {
        const searchTermFromQuery = queryParams.get('search');
        if (searchTermFromQuery) {
          this.searchTerm = searchTermFromQuery;
          return this.productService.searchProducts(searchTermFromQuery);
        }
        return this.activatedRoute.paramMap.pipe(
          switchMap(params => {
            const categoryId = params.get('categoryId');
            if (categoryId) {
              return this.productService.getProductsByCategory(parseInt(categoryId, 10));
            }
            return this.productService.getAllProducts();
          })
        );
      })
    ).subscribe(this.handleProductResponse());
  }

  setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.router.navigate([], {
          relativeTo: this.activatedRoute,
          queryParams: { search: term || null },
          queryParamsHandling: 'merge',
        });
        if (!term.trim()) {
          return this.productService.getAllProducts();
        }
        return this.productService.searchProducts(term);
      })
    ).subscribe(this.handleProductResponse());
  }

  private handleProductResponse() {
    return {
      next: (products: Product[]) => {
        this.products$ = of(products);
        this.errorMessage = null;
      },
      error: (err: any) => {
        this.errorMessage = 'No se pudieron cargar los libros.';
        this.products$ = of([]);
      }
    };
  }

  loadProducts(): void {
    this.errorMessage = null;
    this.productService.getAllProducts().subscribe(this.handleProductResponse());
  }

  onSearchTermChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  executeSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  /**
   * Añade un producto al carrito, ahora con validación en el backend.
   */
  addToCart(product: Product): void {
    this.cartService.addToCart(product).subscribe({
      next: () => {
        // El snackbar ya se muestra en cart.service
      },
      error: (err) => {
        // El snackbar ya se muestra en cart.service para errores de stock/validación
        console.error('Error al añadir producto desde ProductList:', err);
      }
    });
  }

  loadTopSellingProducts(): void {
    this.topSellingProducts$ = this.productService.getTopSellingProducts(5).pipe(
      catchError(error => {
        console.error('Error al cargar los productos más vendidos:', error);
        return of([]);
      })
    );
  }

  viewProductDetail(productId: number): void {
    this.router.navigate(['/productos', productId]);
  }
}

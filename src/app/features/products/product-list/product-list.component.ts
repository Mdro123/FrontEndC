import { Component, OnInit, OnDestroy } from '@angular/core'; 
import { CommonModule, CurrencyPipe, UpperCasePipe } from '@angular/common';
import { ProductService } from '../../../services/product.service';
import { Product, ProductoMasVendidoDTO } from '../../../models/product.model';
import { Observable, Subject, of, Subscription } from 'rxjs'; 
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
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar'; 
import { ChatbotService } from '../../../services/chatbot.service'; 

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
export class ProductListComponent implements OnInit, OnDestroy {
  products$: Observable<Product[]> | null = null;
  categories$: Observable<Category[]> | null = null;
  errorMessage: string | null = null;
  searchTerm: string = '';
  private searchSubject = new Subject<string>();

  topSellingProducts$: Observable<ProductoMasVendidoDTO[]> | null = null;
  private transcriptSubscription!: Subscription;

  constructor(
    private productService: ProductService,
    private activatedRoute: ActivatedRoute,
    private cartService: CartService,
    private categoryService: CategoryService,
    private router: Router,
    private snackBar: MatSnackBar,
    public chatbotService: ChatbotService 
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.setupProductLoading();
    this.setupSearch();
    this.loadTopSellingProducts();
    this.subscribeToVoiceSearch();
  }

  ngOnDestroy(): void {
    if (this.transcriptSubscription) {
      this.transcriptSubscription.unsubscribe();
    }
  }

  private subscribeToVoiceSearch(): void {
    this.transcriptSubscription = this.chatbotService.transcript$.subscribe(transcript => {
      this.searchTerm = transcript;
      this.onSearchTermChange();
    });
  }

  startVoiceSearch(): void {
    if (this.chatbotService.isListening) {
      this.chatbotService.stopListening();
    } else {
      this.chatbotService.startListening();
    }
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

  // --- AÑADIR AL CARRITO ---
  addToCart(product: Product): void {
    // 1. Llamada silenciosa al servicio
    this.cartService.addToCart(product, 1, false).subscribe({
      next: () => {
        // 2. Mostramos notificación personalizada sin botón
        this.showCustomNotification(product.titulo);
      },
      error: (err) => {
        console.error('Error al añadir producto:', err);
        this.snackBar.open('No se pudo añadir al carrito.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // --- MÉTODO CORREGIDO: Sin botón de cerrar ---
  private showCustomNotification(productTitle: string): void {
    const config: MatSnackBarConfig = {
      duration: 2500, // Duración en milisegundos (2.5 segundos)
      horizontalPosition: 'right', 
      verticalPosition: 'bottom',  
      panelClass: ['custom-cart-toast']
    };

    // Al pasar 'undefined' como segundo parámetro, NO se crea el botón de acción
    this.snackBar.open(`✅ "${productTitle}" añadido al carrito`, undefined, config);
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

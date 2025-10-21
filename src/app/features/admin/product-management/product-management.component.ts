import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, UpperCasePipe } from '@angular/common';
import { ProductService } from '../../../services/product.service';
import { Product, ProductoMasVendidoDTO } from '../../../models/product.model';
import { Observable, Subject, of } from 'rxjs';
import { switchMap, debounceTime, distinctUntilChanged, catchError, tap } from 'rxjs/operators';
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
  // Observables para los datos de la vista
  products$: Observable<Product[]> = of([]);
  categories$: Observable<Category[]> | null = null;
  topSellingProducts$: Observable<ProductoMasVendidoDTO[]> = of([]);

  // Propiedades de estado
  errorMessage: string | null = null;
  isLoading: boolean = true;
  searchTerm: string = '';
  listTitle: string = 'Nuestros Libros';

  private searchSubject = new Subject<string>();

  constructor(
    private productService: ProductService,
    private activatedRoute: ActivatedRoute,
    private cartService: CartService,
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.setupProductLoading();
    this.setupSearch();
    this.loadTopSellingProducts(); // Cargar los más vendidos al iniciar
  }

  loadCategories(): void {
    this.categories$ = this.categoryService.getAllCategories().pipe(
      catchError(() => of([]))
    );
  }

  // Carga la lista principal de productos (todos, por categoría o por búsqueda)
  setupProductLoading(): void {
    this.isLoading = true;
    this.products$ = this.activatedRoute.paramMap.pipe(
      switchMap(params => {
        this.isLoading = true;
        const categoryId = params.get('categoryId');
        const searchTermFromQuery = this.activatedRoute.snapshot.queryParamMap.get('search');

        if (categoryId) {
          const id = parseInt(categoryId, 10);
          this.categoryService.getCategoryById(id).pipe(tap(cat => this.listTitle = cat.nombre)).subscribe();
          return this.productService.getProductsByCategory(id);
        } else if (searchTermFromQuery) {
          this.listTitle = `Resultados para "${searchTermFromQuery}"`;
          return this.productService.searchProducts(searchTermFromQuery);
        } else {
          this.listTitle = 'Nuestros Libros';
          return this.productService.getAllProducts();
        }
      }),
      tap(() => {
        this.isLoading = false;
        this.errorMessage = null;
      }),
      catchError(err => {
        this.isLoading = false;
        this.errorMessage = 'No se pudieron cargar los libros.';
        return of([]);
      })
    );
  }

  // Carga la lista de "Más Vendidos" de forma independiente
  loadTopSellingProducts(): void {
    this.topSellingProducts$ = this.productService.getTopSellingProducts(5).pipe(
      catchError(error => {
        console.error('Error al cargar los productos más vendidos:', error);
        return of([]); // Devuelve un array vacío si hay un error
      })
    );
  }

  // Configura la lógica de búsqueda "inteligente" (debounce)
  setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      const queryParams = term ? { search: term } : {};
      this.router.navigate(['/'], { queryParams: queryParams });
    });
  }

  // Se llama cada vez que el texto de búsqueda cambia
  onSearchTermChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  // Se llama con Enter o el botón de buscar
  executeSearch(): void {
    this.onSearchTermChange();
  }
  
  // Navega al detalle del producto
  viewProductDetail(id: number): void {
    this.router.navigate(['/productos', id]);
  }

  // Añade un producto al carrito
  addToCart(product: Product): void {
    this.cartService.addToCart(product);
  }

  // Se llama con el botón "Reintentar"
  loadProducts(): void {
    this.setupProductLoading();
  }
}

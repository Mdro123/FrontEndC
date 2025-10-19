import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, UpperCasePipe } from '@angular/common';
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../models/product.model';
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
  products$: Observable<Product[]> | null = null;
  categories$: Observable<Category[]> | null = null;
  errorMessage: string | null = null;
  searchTerm: string = '';
  private searchSubject = new Subject<string>();

  listTitle: string = 'Nuestros Libros';

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
  }

  loadCategories(): void {
    this.categories$ = this.categoryService.getAllCategories().pipe(
      catchError(error => of([]))
    );
  }

  setupProductLoading(): void {
    // Escucha tanto los parámetros de la ruta (/:categoryId) como los queryParams (?search=...)
    this.activatedRoute.paramMap.pipe(
      switchMap(params => {
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
      })
    ).subscribe(this.handleProductResponse());
  }

  setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      // Al buscar, navegamos a la ruta raíz y pasamos el término como queryParam
      // Esto dispara la lógica en setupProductLoading
      const queryParams = term ? { search: term } : {};
      this.router.navigate(['/'], { queryParams: queryParams });
    });
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
  
  onSearchTermChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product);
  }
}

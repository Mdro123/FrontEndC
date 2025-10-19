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
  products$: Observable<Product[]> = of([]);
  categories$: Observable<Category[]> | null = null;
  errorMessage: string | null = null;
  isLoading: boolean = true;
  searchTerm: string = '';
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
  }

  loadCategories(): void {
    this.categories$ = this.categoryService.getAllCategories().pipe(
      catchError(error => of([]))
    );
  }

  setupProductLoading(): void {
    this.isLoading = true;
    this.products$ = this.activatedRoute.paramMap.pipe(
      switchMap(params => {
        this.isLoading = true; // Activar carga en cada cambio de filtro
        const categoryId = params.get('categoryId');
        const searchTermFromQuery = this.activatedRoute.snapshot.queryParamMap.get('search');

        if (categoryId) {
          return this.productService.getProductsByCategory(parseInt(categoryId, 10));
        } else if (searchTermFromQuery) {
          return this.productService.searchProducts(searchTermFromQuery);
        } else {
          return this.productService.getAllProducts();
        }
      }),
      tap(() => {
        this.isLoading = false; // Desactivar carga cuando los productos llegan
        this.errorMessage = null;
      }),
      catchError(err => {
        this.isLoading = false;
        this.errorMessage = 'No se pudieron cargar los libros.';
        return of([]);
      })
    );
  }

  setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      const queryParams = term ? { search: term } : {};
      this.router.navigate(['/'], { queryParams: queryParams });
    });
  }
  
  onSearchTermChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product);
  }
}

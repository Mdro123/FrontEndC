import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { Product, ProductDTO, Category } from '../../../models/product.model';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule,
    ReactiveFormsModule, MatSelectModule, CurrencyPipe, MatCardModule
  ],
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.css']
})
export class ProductManagementComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = ['id', 'titulo', 'autor', 'categoria', 'precio', 'stock', 'isbn', 'acciones'];
  dataSource: MatTableDataSource<Product> = new MatTableDataSource<Product>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading: boolean = true;
  errorMessage: string | null = null;
  categories: Category[] = [];

  showForm: boolean = false;
  productForm!: FormGroup;
  isEditing: boolean = false;
  editingProductId: number | null = null;
  formErrorMessage: string | null = null;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.productForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100), Validators.pattern('.*[a-zA-ZáéíóúÁÉÍÓÚñÑ].*')]],
      autor: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern('.*[a-zA-ZáéíóúÁÉÍÓÚñÑ].*')]], // MODIFICADO
      isbn: ['', [Validators.required, Validators.minLength(13), Validators.maxLength(13), Validators.pattern('^\\d{13}$')]],
      precio: [null, [Validators.required, Validators.min(0.01), Validators.pattern('^\\d*\\.?\\d+$')]], // MODIFICADO
      stock: [null, [Validators.required, Validators.min(0), Validators.pattern('^[0-9]*$')]],
      idCategoria: [null, Validators.required],
      imagenUrl: ['', [Validators.required, Validators.pattern('^(https?://\\S+)\\.(jpg|jpeg|png)$')]], // MODIFICADO
      sinopsis: ['', [Validators.required, Validators.maxLength(500), Validators.pattern('.*[a-zA-ZáéíóúÁÉÍÓÚñÑ].*')]] // MODIFICADO
    });

    this.loadProducts();
    this.loadCategories();
  }

  // ... (el resto de los métodos de la clase no necesitan cambios)
  ngAfterViewInit() { this.dataSource.paginator = this.paginator; this.dataSource.sort = this.sort; }
  loadProducts(): void { /* ... */ }
  loadCategories(): void { /* ... */ }
  applyFilter(event: Event): void { /* ... */ }
  openAddForm(): void { /* ... */ }
  openEditForm(product: Product): void { /* ... */ }
  saveProduct(): void { /* ... */ }
  deleteProduct(id: number, title: string): void { /* ... */ }
  cancelForm(): void { /* ... */ }
}

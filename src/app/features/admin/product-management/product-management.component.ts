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
      autor: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern('.*[a-zA-ZáéíóúÁÉÍÓÚñÑ].*')]],
      isbn: ['', [Validators.required, Validators.minLength(13), Validators.maxLength(13), Validators.pattern('^\\d{13}$')]],
      precio: [null, [Validators.required, Validators.min(0.01), Validators.pattern('^\\d*\\.?\\d+$')]],
      stock: [null, [Validators.required, Validators.min(0), Validators.pattern('^[0-9]*$')]],
      idCategoria: [null, Validators.required],
      imagenUrl: ['', [Validators.required, Validators.pattern('^(https?://\\S+)\\.(jpg|jpeg|png)$')]],
      sinopsis: ['', [Validators.required, Validators.maxLength(500), Validators.pattern('.*[a-zA-ZáéíóúÁÉÍÓÚñÑ].*')]]
    });

    this.loadProducts();
    this.loadCategories();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        this.dataSource.data = products;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar los productos.';
        this.isLoading = false;
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => this.categories = categories,
      error: () => this.snackBar.open('Error al cargar categorías.', 'Cerrar', { duration: 3000 })
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  openAddForm(): void {
    this.isEditing = false;
    this.editingProductId = null;
    this.productForm.reset();
    this.showForm = true;
    this.formErrorMessage = null;
  }

  openEditForm(product: Product): void {
    this.isEditing = true;
    this.editingProductId = product.id;
    this.productForm.patchValue({
      titulo: product.titulo,
      autor: product.autor,
      isbn: product.isbn,
      precio: product.precio,
      stock: product.stock,
      idCategoria: product.categoria?.id,
      imagenUrl: product.imagenUrl,
      sinopsis: product.sinopsis
    });
    this.showForm = true;
    this.formErrorMessage = null;
  }

  saveProduct(): void {
    this.formErrorMessage = null;
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const productData: ProductDTO = this.productForm.value;
    let saveObservable: Observable<Product>;

    if (this.isEditing && this.editingProductId) {
      saveObservable = this.productService.updateProduct(this.editingProductId, productData);
    } else {
      saveObservable = this.productService.createProduct(productData);
    }

    saveObservable.subscribe({
      next: (savedProduct) => {
        this.snackBar.open(`Libro "${savedProduct.titulo}" guardado.`, 'Cerrar', { duration: 3000 });
        this.loadProducts();
        this.cancelForm();
      },
      error: (err: HttpErrorResponse) => {
        this.formErrorMessage = err.error?.message || 'Error al guardar el libro.';
      }
    });
  }

  deleteProduct(id: number, title: string): void {
    if (confirm(`¿Estás seguro de que quieres eliminar el libro "${title}"?`)) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.snackBar.open('Libro eliminado.', 'Cerrar', { duration: 3000 });
          this.loadProducts();
        },
        error: (err: HttpErrorResponse) => {
          this.snackBar.open(err.error?.message || 'Error al eliminar.', 'Cerrar', { duration: 4000 });
        }
      });
    }
  }

  cancelForm(): void {
    this.showForm = false;
    this.productForm.reset();
    this.isEditing = false;
    this.editingProductId = null;
    this.formErrorMessage = null;
  }
}

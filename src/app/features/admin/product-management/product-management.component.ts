import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';

import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { Product, ProductDTO, Category } from '../../../models/product.model';

import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http'; // <-- Importar HttpErrorResponse

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    FormsModule,
    MatSelectModule,
    CurrencyPipe,
    MatCardModule
  ],
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.css']
})
export class ProductManagementComponent implements OnInit {

  displayedColumns: string[] = ['id', 'titulo', 'autor', 'categoria', 'precio', 'stock', 'isbn', 'acciones'];
  dataSource: MatTableDataSource<Product> = new MatTableDataSource<Product>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading: boolean = true;
  errorMessage: string | null = null;
  categories: Category[] = [];

  isEditing: boolean = false;
  currentProduct: ProductDTO = this.resetProductForm();
  showForm: boolean = false;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  ngAfterViewInit() {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }


  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.productService.getAllProducts().pipe(
      tap(() => this.isLoading = false),
      catchError((error: any) => {
        console.error('Error al cargar productos:', error);
        this.errorMessage = 'No se pudieron cargar los productos. Intenta de nuevo más tarde.';
        this.isLoading = false;
        return of([]);
      })
    ).subscribe((products: Product[]) => {
      this.dataSource = new MatTableDataSource<Product>(products);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().pipe(
      catchError((error: any) => {
        console.error('Error al cargar categorías:', error);
        this.snackBar.open('No se pudieron cargar las categorías. Esto afectará la creación/edición de productos.', 'Cerrar', { duration: 5000, panelClass: ['snackbar-warn'] });
        return of([]);
      })
    ).subscribe((categories: Category[]) => {
      this.categories = categories;
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openAddForm(): void {
    this.isEditing = false;
    this.currentProduct = this.resetProductForm();
    this.showForm = true;
  }

  openEditForm(product: Product): void {
    this.isEditing = true;
    this.currentProduct = {
      id: product.id,
      isbn: product.isbn,
      titulo: product.titulo,
      autor: product.autor,
      sinopsis: product.sinopsis,
      precio: product.precio,
      stock: product.stock,
      imagenUrl: product.imagenUrl,
      idCategoria: product.categoria ? product.categoria.id : null
    };
    this.showForm = true;
  }

  resetProductForm(): ProductDTO {
    return {
      id: null,
      isbn: '',
      titulo: '',
      autor: '',
      sinopsis: '',
      precio: 0,
      stock: 0,
      imagenUrl: '',
      idCategoria: null
    };
  }

  saveProduct(): void {
    if (!this.currentProduct.titulo || !this.currentProduct.autor || !this.currentProduct.isbn || this.currentProduct.precio <= 0 || this.currentProduct.stock < 0 || !this.currentProduct.idCategoria) {
      this.snackBar.open('Por favor, rellena todos los campos obligatorios y asegúrate que el precio y stock sean válidos.', 'Cerrar', { duration: 4000, panelClass: ['snackbar-error'] });
      return;
    }

    this.productService.saveProduct(this.currentProduct).subscribe({
      next: (savedProduct: Product) => {
        this.snackBar.open(`Libro "${savedProduct.titulo}" guardado exitosamente.`, 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
        this.loadProducts();
        this.showForm = false;
        this.currentProduct = this.resetProductForm();
      },
      error: (error: HttpErrorResponse) => { // Especificar HttpErrorResponse
        // Intentar obtener el mensaje específico del backend si es un error 400 o 409
        const backendMessage = error.error?.message; // Acceder a la propiedad 'message' del objeto error.error
        const displayMessage = backendMessage || 'Error al guardar el libro. Intenta de nuevo.';
        this.snackBar.open(displayMessage, 'Cerrar', { duration: 5000, panelClass: ['snackbar-error'] });
        console.error('Error al guardar producto:', error);
      }
    });
  }

  deleteProduct(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar este libro? Esta acción es irreversible.')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.snackBar.open('Libro eliminado exitosamente.', 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
          this.loadProducts();
        },
        error: (error: HttpErrorResponse) => { // Especificar HttpErrorResponse
          // Intentar obtener el mensaje específico del backend si es un error 400 o 409
          const backendMessage = error.error?.message; // Acceder a la propiedad 'message' del objeto error.error
          const displayMessage = backendMessage || 'Error al eliminar el libro. Intenta de nuevo.';
          this.snackBar.open(displayMessage, 'Cerrar', { duration: 5000, panelClass: ['snackbar-error'] });
          console.error('Error al eliminar producto:', error);
        }
      });
    }
  }

  cancelForm(): void {
    this.showForm = false;
    this.currentProduct = this.resetProductForm();
  }
}

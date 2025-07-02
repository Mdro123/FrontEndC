import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { MatCardModule } from '@angular/material/card'; // Importar MatCardModule

import { CategoryService } from '../../../services/category.service';
import { Category, CategoryDTO } from '../../../models/category.model'; // Asegúrate de importar Category y CategoryDTO

import { of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Component({
  selector: 'app-category-management',
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
    FormsModule, // Para ngModel
    MatCardModule // Añadir MatCardModule aquí
  ],
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.css']
})
export class CategoryManagementComponent implements OnInit {

  displayedColumns: string[] = ['id', 'nombre', 'descripcion', 'createdAt', 'updatedAt', 'acciones'];
  dataSource: MatTableDataSource<Category> = new MatTableDataSource<Category>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading: boolean = true;
  errorMessage: string | null = null;

  isEditing: boolean = false;
  currentCategory: CategoryDTO = this.resetCategoryForm();
  showForm: boolean = false;

  constructor(
    private categoryService: CategoryService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadCategories();
  }

  ngAfterViewInit() {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.categoryService.getAllCategories().pipe(
      tap(() => this.isLoading = false),
      catchError((error: any) => {
        console.error('Error al cargar categorías:', error);
        this.errorMessage = 'No se pudieron cargar las categorías. Intenta de nuevo más tarde.';
        this.isLoading = false;
        return of([]);
      })
    ).subscribe((categories: Category[]) => {
      this.dataSource = new MatTableDataSource<Category>(categories);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
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
    this.currentCategory = this.resetCategoryForm();
    this.showForm = true;
  }

  openEditForm(category: Category): void {
    this.isEditing = true;
    this.currentCategory = {
      id: category.id,
      nombre: category.nombre,
      descripcion: category.descripcion || ''
    };
    this.showForm = true;
  }

  resetCategoryForm(): CategoryDTO {
    return {
      id: null,
      nombre: '',
      descripcion: ''
    };
  }

  saveCategory(): void {
    if (!this.currentCategory.nombre) {
      this.snackBar.open('El nombre de la categoría es obligatorio.', 'Cerrar', { duration: 4000, panelClass: ['snackbar-error'] });
      return;
    }

    this.categoryService.saveCategory(this.currentCategory).subscribe({
      next: (savedCategory: Category) => {
        this.snackBar.open(`Categoría "${savedCategory.nombre}" guardada exitosamente.`, 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
        this.loadCategories(); // Recargar la tabla
        this.showForm = false; // Ocultar el formulario
        this.currentCategory = this.resetCategoryForm(); // Limpiar formulario
      },
      error: (error: any) => {
        const message = error.error?.message || 'Error al guardar la categoría. Intenta de nuevo.';
        this.snackBar.open(message, 'Cerrar', { duration: 5000, panelClass: ['snackbar-error'] });
        console.error('Error al guardar categoría:', error);
      }
    });
  }

  deleteCategory(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta categoría? Esta acción es irreversible.')) {
      this.categoryService.deleteCategory(id).subscribe({
        next: () => {
          this.snackBar.open('Categoría eliminada exitosamente.', 'Cerrar', { duration: 3000, panelClass: ['snackbar-success'] });
          this.loadCategories(); // Recargar la tabla
        },
        error: (error: any) => {
          const message = error.error?.message || 'Error al eliminar la categoría. Intenta de nuevo.';
          this.snackBar.open(message, 'Cerrar', { duration: 5000, panelClass: ['snackbar-error'] });
          console.error('Error al eliminar categoría:', error);
        }
      });
    }
  }

  cancelForm(): void {
    this.showForm = false;
    this.currentCategory = this.resetCategoryForm();
  }
}

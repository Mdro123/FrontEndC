import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
import { MatCardModule } from '@angular/material/card';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CategoryService } from '../../../services/category.service';
import { Category, CategoryDTO } from '../../../models/category.model';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatSnackBarModule, MatProgressSpinnerModule,
    MatCardModule, ReactiveFormsModule, // <-- Añadido ReactiveFormsModule
    DatePipe // Para formatear fechas
  ],
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.css']
})
export class CategoryManagementComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = ['id', 'nombre', 'descripcion', 'createdAt', 'acciones'];
  dataSource: MatTableDataSource<Category> = new MatTableDataSource<Category>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  isLoading: boolean = true;
  errorMessage: string | null = null;
  showForm: boolean = false;

  // --- LÓGICA DEL FORMULARIO ---
  categoryForm!: FormGroup;
  isEditing: boolean = false;
  editingCategoryId: number | null = null;
  formErrorMessage: string | null = null;

  constructor(
    private categoryService: CategoryService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder // Inyectar FormBuilder
  ) { }

  ngOnInit(): void {
    // Inicializamos el formulario con las validaciones
    this.categoryForm = this.fb.group({
      nombre: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')
      ]],
      descripcion: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(255)
      ]]
    });
    this.loadCategories();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.categoryService.getAllCategories().subscribe({
      next: (categories) => {
        this.dataSource.data = categories;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'No se pudieron cargar las categorías.';
        this.isLoading = false;
      }
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
    this.editingCategoryId = null;
    this.categoryForm.reset();
    this.showForm = true;
    this.formErrorMessage = null;
  }

  openEditForm(category: Category): void {
    this.isEditing = true;
    this.editingCategoryId = category.id;
    this.categoryForm.setValue({
      nombre: category.nombre,
      descripcion: category.descripcion || ''
    });
    this.showForm = true;
    this.formErrorMessage = null;
  }

  saveCategory(): void {
    this.formErrorMessage = null;
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const categoryData: CategoryDTO = this.categoryForm.value;
    let saveObservable: Observable<Category>;

    if (this.isEditing && this.editingCategoryId) {
      saveObservable = this.categoryService.updateCategory(this.editingCategoryId, categoryData);
    } else {
      saveObservable = this.categoryService.createCategory(categoryData);
    }

    saveObservable.subscribe({
      next: (savedCategory) => {
        this.snackBar.open(`Categoría "${savedCategory.nombre}" guardada.`, 'Cerrar', { duration: 3000 });
        this.loadCategories();
        this.cancelForm();
      },
      error: (err) => {
        this.formErrorMessage = err.error.message || 'Error al guardar la categoría.';
      }
    });
  }

  deleteCategory(id: number, name: string): void {
    if (confirm(`¿Estás seguro de que quieres eliminar la categoría "${name}"?`)) {
      this.categoryService.deleteCategory(id).subscribe({
        next: () => {
          this.snackBar.open('Categoría eliminada.', 'Cerrar', { duration: 3000 });
          this.loadCategories();
        },
        error: (err) => {
          this.snackBar.open(err.error.message || 'Error al eliminar.', 'Cerrar', { duration: 4000 });
        }
      });
    }
  }

  cancelForm(): void {
    this.showForm = false;
    this.categoryForm.reset();
    this.isEditing = false;
    this.editingCategoryId = null;
    this.formErrorMessage = null;
  }
}

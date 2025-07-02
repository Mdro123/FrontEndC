// src/app/services/category.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, CategoryDTO } from '../models/category.model';

// --- Importar el archivo de entorno ---
import { environment } from '../../environments/environment.prod';
// ------------------------------------

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  // --- Usar la URL base del entorno ---
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/categorias`;
  // ------------------------------------

  constructor(private http: HttpClient) { }

  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
  }

  getCategoryById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  /**
   * Método unificado para crear o actualizar una categoría.
   * SIEMPRE envía una petición POST al backend, que maneja la lógica de creación/actualización
   * basándose en la presencia del ID en el CategoryDTO.
   * @param category La CategoryDTO a guardar.
   * @returns Un Observable con la Category guardada/actualizada.
   */
  saveCategory(category: CategoryDTO): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, category);
  }

  /**
   * Elimina una categoría por su ID.
   * @param id El ID de la categoría a eliminar.
   * @returns Un Observable<void> que indica el éxito de la operación.
   */
  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

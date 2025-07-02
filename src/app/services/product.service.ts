// src/app/services/product.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, ProductDTO, ProductoMasVendidoDTO } from '../models/product.model';

// --- Importar el archivo de entorno ---
import { environment } from '../../environments/environment.prod';
// ------------------------------------

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  // --- Usar la URL base del entorno ---
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/productos`;
  // ------------------------------------

  constructor(private http: HttpClient) { }

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getProductsByCategory(categoryId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/categoria/${categoryId}`);
  }

  searchProducts(term: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/buscar?termino=${term}`);
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  /**
   * Método unificado para crear o actualizar un producto.
   * SIEMPRE envía una petición POST al backend, que maneja la lógica de creación/actualización
   * basándose en la presencia del ID en el ProductDTO.
   * @param product El ProductDTO a guardar.
   * @returns Un Observable con el Product guardado/actualizado.
   */
  saveProduct(product: ProductDTO): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  /**
   * Elimina un producto por su ID.
   * @param id El ID del producto a eliminar.
   * @returns Un Observable<void> que indica el éxito de la operación.
   */
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene la lista de productos más vendidos del backend.
   * @param limit El número de productos más vendidos a obtener.
   * @returns Un Observable con la lista de ProductoMasVendidoDTO.
   */
  getTopSellingProducts(limit: number): Observable<ProductoMasVendidoDTO[]> {
    return this.http.get<ProductoMasVendidoDTO[]>(`${this.apiUrl}/mas-vendidos?limit=${limit}`);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';
import { WishlistItem } from '../models/wishlist.model';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private apiUrl = `${environment.apiUrl}/wishlist`;

  constructor(private http: HttpClient) { }

  // 1. Obtener mi lista
  getMyWishlist(): Observable<WishlistItem[]> {
    return this.http.get<WishlistItem[]>(this.apiUrl);
  }

  // 2. Añadir a la lista
  addToWishlist(productId: number): Observable<any> {
    // Enviamos un cuerpo vacío {} porque es un POST
    return this.http.post(`${this.apiUrl}/add/${productId}`, {}, { responseType: 'text' });
  }

  // 3. Eliminar de la lista
  removeFromWishlist(productId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/remove/${productId}`, { responseType: 'text' });
  }
}

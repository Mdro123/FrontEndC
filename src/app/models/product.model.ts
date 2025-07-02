export interface ProductoMasVendidoDTO {
  id: number;
  isbn: string;
  titulo: string;
  autor: string;
  imagenUrl: string;
  precio: number;
  cantidadTotalVendida: number;
}

export interface Category {
  id: number;
  nombre: string;
  descripcion?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: number;
  isbn: string;
  titulo: string;
  autor: string;
  sinopsis: string;
  precio: number;
  stock: number;
  imagenUrl: string;
  categoria: Category;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDTO {
  id: number | null;
  isbn: string;
  titulo: string;
  autor: string;
  sinopsis: string;
  precio: number;
  stock: number;
  imagenUrl: string;
  idCategoria: number | null;
}

export interface CartItem extends Product {
  quantity: number;
}

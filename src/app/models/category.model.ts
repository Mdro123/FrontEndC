export interface Category {
  id: number;
  nombre: string;
  descripcion: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDTO {
  id: number | null;
  nombre: string;
  descripcion: string;
}

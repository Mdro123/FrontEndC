export interface ItemValidado {
  productId: number;
  titulo: string;
  imagenUrl: string;
  precioUnitario: number;
  cantidadSolicitada: number;
  cantidadDisponible: number;
  valido: boolean;
  mensaje: string;
}

export interface CarritoValidacionResponse {
  itemsValidados: ItemValidado[];
  totalCalculado: number;
  carritoCompletoValido: boolean;
}

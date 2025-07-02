/**
 * Define las estructuras de datos relacionadas con los Pedidos.
 */

export interface CartItemRequest {
  productId: number;
  cantidad: number;
}

export interface ConfirmarCompraRequest {
  idMetodoPago: number;
  items: CartItemRequest[];
  paymentMethodId?: string;
}

export interface OrderDetailResponse {
  id: number;
  idProducto: number;
  tituloProducto: string;
  imagenProductoUrl: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface PedidoResponse {
  id: number;
  idUsuario: number;
  nombreUsuario: string;
  metodoPagoNombre: string;
  estado: string;
  total: number;
  fecha: string;
  createdAt: string;
  updatedAt: string;
  detalles: OrderDetailResponse[];
  clientSecret?: string;
  paymentIntentId?: string;
  paymentStatus?: string;
}

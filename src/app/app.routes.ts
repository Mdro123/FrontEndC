import { Routes } from '@angular/router';
import { LoginComponent } from './auth/components/login/login.component';
import { RegisterComponent } from './auth/components/register/register.component';
import { ProductListComponent } from './features/products/product-list/product-list.component';
import { ProductDetailComponent } from './features/products/product-detail/product-detail.component';
import { CartComponent } from './features/cart/cart/cart.component';
import { CheckoutComponent } from './features/checkout/checkout/checkout.component';
import { OrderConfirmationComponent } from './features/orders/order-confirmation/order-confirmation.component';
import { authGuard } from './guards/auth.guards';
import { adminGuard } from './guards/admin.guard';
import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard.component';
// --- 1. IMPORTAR EL COMPONENTE DE LISTA DE DESEOS ---
import { MyWishlistComponent } from './features/wishlist/my-wishlist/my-wishlist.component';

export const routes: Routes = [
  // --- RUTAS PÚBLICAS ---
  {
    path: '',
    component: ProductListComponent,
  },
  {
    path: 'productos/categoria/:categoryId',
    component: ProductListComponent,
  },
  {
    path: 'productos/:id',
    component: ProductDetailComponent,
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'registro',
    component: RegisterComponent
  },
  {
    path: 'carrito',
    component: CartComponent
  },

  // --- RUTAS PRIVADAS (Requieren Login) ---
  {
    path: 'checkout',
    component: CheckoutComponent,
    canActivate: [authGuard]
  },
  {
    path: 'confirmacion-pedido',
    component: OrderConfirmationComponent,
    canActivate: [authGuard]
  },
  {
    path: 'mis-pedidos',
    loadComponent: () => import('./features/orders/my-orders/my-orders.component').then(m => m.MyOrdersComponent),
    canActivate: [authGuard]
  },

  // --- 2. NUEVA RUTA: MI LISTA DE DESEOS ---
  {
    path: 'mi-lista-deseos',
    component: MyWishlistComponent,
    canActivate: [authGuard] // Protegida: solo usuarios logueados pueden verla
  },
  // -----------------------------------------

  // --- RUTA DE ADMINISTRADOR ---
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'productos', pathMatch: 'full' },
      {
        path: 'productos',
        loadComponent: () => import('./features/admin/product-management/product-management.component').then(m => m.ProductManagementComponent)
      },
      {
        path: 'categorias',
        loadComponent: () => import('./features/admin/category-management/category-management.component').then(m => m.CategoryManagementComponent)
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./features/admin/order-management/order-management.component').then(m => m.OrderManagementComponent)
      },
    ]
  },

  // --- RUTA COMODÍN ---
  { path: '**', redirectTo: '' }
];

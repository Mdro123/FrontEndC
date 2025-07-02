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
import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard.component'; // Importar AdminDashboardComponent

export const routes: Routes = [
  // ... (rutas públicas y privadas existentes se mantienen igual) ...
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

  // --- RUTA DE ADMINISTRADOR CON RUTAS HIJAS (¡CAMBIO AQUÍ!) ---
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
        // CAMBIADO: Antes era 'metodos-pago', ahora es 'pedidos' y carga OrderManagementComponent
        path: 'pedidos',
        loadComponent: () => import('./features/admin/order-management/order-management.component').then(m => m.OrderManagementComponent)
      },
    ]
  },

  // --- RUTA COMODÍN ---
  { path: '**', redirectTo: '' }
];

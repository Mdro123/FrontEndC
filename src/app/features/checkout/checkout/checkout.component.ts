import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CartService } from '../../../services/cart.service';
import { PaymentService } from '../../../services/payment.service';
import { CartItem } from '../../../models/product.model';
import { ConfirmarCompraRequest, PedidoResponse, CartItemRequest } from '../../../models/order.model';
import { Subscription } from 'rxjs';

declare var Stripe: any;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatInputModule, MatFormFieldModule,
    ReactiveFormsModule, CurrencyPipe
  ],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('cardElement') cardElementRef!: ElementRef;
  
  checkoutForm!: FormGroup;
  cartItems: CartItem[] = [];
  cartSubtotal: number = 0;
  private cartSubscription!: Subscription;

  loading: boolean = true;
  processing: boolean = false;
  paymentError: string | null = null;
  paymentSuccess: boolean = false;

  stripe: any;
  card: any;
  
  constructor(
    private cartService: CartService,
    private paymentService: PaymentService,
    private router: Router,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.checkoutForm = this.fb.group({
      nombre: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(50),
        Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')
      ]],
      direccion: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(100),
        Validators.pattern('.*[a-zA-ZáéíóúÁÉÍÓÚñÑ].*')
      ]],
      ciudad: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')
      ]],
      codigoPostal: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(5),
        Validators.pattern('^\\d{5}$')
      ]]
    });

    this.cartSubscription = this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.cartSubtotal = items.reduce((total, item) => total + (item.precio * item.quantity), 0);
      if (this.cartItems.length === 0 && !this.loading) {
        this.router.navigate(['/carrito']);
      }
    });

    this.loadStripeScript().then(() => {
      this.stripe = Stripe('pk_test_51RYvDlQTxkcZLSDx0KHQCoFQEikDRLTYSNSfNwzWa7O5AIQtnUooWYO4L3a2qq8p5SHP9XL2oh9Ymgm2L6QEp6fO00BVNuwVlB');
      this.loading = false;
    }).catch(error => {
      this.paymentError = 'No se pudo cargar el formulario de pago.';
      this.loading = false;
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initStripeCardElement(), 1000);
  }

  async handlePayment(): Promise<void> {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      this.snackBar.open('Por favor, revisa los campos del formulario.', 'Cerrar', { duration: 3000 });
      return;
    }

    this.processing = true;
    this.paymentError = null;

    const formValue = this.checkoutForm.value;
    const itemsForRequest: CartItemRequest[] = this.cartItems.map(item => ({
      productId: item.id,
      cantidad: item.quantity
    }));

    try {
      const { paymentMethod, error } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.card,
        billing_details: {
          name: formValue.nombre,
          address: {
            line1: formValue.direccion,
            city: formValue.ciudad,
            postal_code: formValue.codigoPostal,
            country: 'PE',
          }
        },
      });

      if (error) {
        this.paymentError = error.message;
        this.processing = false;
        return;
      }

      const purchaseRequest: ConfirmarCompraRequest = {
        idMetodoPago: 1,
        items: itemsForRequest,
        paymentMethodId: paymentMethod.id,
        nombre: formValue.nombre,
        direccion: formValue.direccion,
        ciudad: formValue.ciudad,
        codigoPostal: formValue.codigoPostal
      };

      this.paymentService.confirmPurchase(purchaseRequest).subscribe({
        next: (response) => {
          if (response) {
            this.handleServerResponse(response);
          } else {
            this.paymentError = 'Error de comunicación con el servidor.';
            this.processing = false;
          }
        },
        error: () => {
          this.paymentError = 'Ocurrió un error inesperado al procesar el pago.';
          this.processing = false;
        }
      });
    } catch (e) {
      this.paymentError = 'Un error inesperado ocurrió.';
      this.processing = false;
    }
  }

  private async handleServerResponse(response: PedidoResponse) {
    if (response.paymentStatus === 'succeeded') {
      this.onPaymentSuccess();
    } else if (response.paymentStatus === 'requires_action' && response.clientSecret) {
      const { error } = await this.stripe.confirmCardPayment(response.clientSecret);
      if (error) {
        this.paymentError = error.message;
        this.processing = false;
      } else {
        this.onPaymentSuccess();
      }
    } else {
      this.paymentError = `El pago falló: ${response.paymentStatus}. Intenta de nuevo.`;
      this.processing = false;
    }
  }
  
  private onPaymentSuccess() {
    this.paymentSuccess = true;
    this.cartService.clearCart();
    this.router.navigate(['/confirmacion-pedido']);
  }
  
  private loadStripeScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById('stripe-script')) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.id = 'stripe-script';
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.body.appendChild(script);
    });
  }

  private initStripeCardElement(): void {
    if (this.stripe) {
      const elements = this.stripe.elements();
      this.card = elements.create('card');
      this.card.mount(this.cardElementRef.nativeElement);
      this.card.on('change', (event: any) => {
        this.paymentError = event.error ? event.error.message : null;
      });
    }
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) { this.cartSubscription.unsubscribe(); }
    if (this.card) { this.card.destroy(); }
  }
}import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CartService } from '../../../services/cart.service';
import { PaymentService } from '../../../services/payment.service';
import { CartItem } from '../../../models/product.model';
import { ConfirmarCompraRequest, PedidoResponse, CartItemRequest } from '../../../models/order.model';
import { Subscription } from 'rxjs';

declare var Stripe: any;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatInputModule, MatFormFieldModule,
    ReactiveFormsModule, CurrencyPipe
  ],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('cardElement') cardElementRef!: ElementRef;
  
  checkoutForm!: FormGroup;
  cartItems: CartItem[] = [];
  cartSubtotal: number = 0;
  private cartSubscription!: Subscription;

  loading: boolean = true;
  processing: boolean = false;
  paymentError: string | null = null;
  paymentSuccess: boolean = false;

  stripe: any;
  card: any;
  
  constructor(
    private cartService: CartService,
    private paymentService: PaymentService,
    private router: Router,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.checkoutForm = this.fb.group({
      nombre: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(50),
        Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')
      ]],
      direccion: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(100),
        Validators.pattern('.*[a-zA-ZáéíóúÁÉÍÓÚñÑ].*')
      ]],
      ciudad: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')
      ]],
      codigoPostal: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(5),
        Validators.pattern('^\\d{5}$')
      ]]
    });

    this.cartSubscription = this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.cartSubtotal = items.reduce((total, item) => total + (item.precio * item.quantity), 0);
      if (this.cartItems.length === 0 && !this.loading) {
        this.router.navigate(['/carrito']);
      }
    });

    this.loadStripeScript().then(() => {
      this.stripe = Stripe('pk_test_51RYvDlQTxkcZLSDx0KHQCoFQEikDRLTYSNSfNwzWa7O5AIQtnUooWYO4L3a2qq8p5SHP9XL2oh9Ymgm2L6QEp6fO00BVNuwVlB');
      this.loading = false;
    }).catch(error => {
      this.paymentError = 'No se pudo cargar el formulario de pago.';
      this.loading = false;
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initStripeCardElement(), 1000);
  }

  async handlePayment(): Promise<void> {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      this.snackBar.open('Por favor, revisa los campos del formulario.', 'Cerrar', { duration: 3000 });
      return;
    }

    this.processing = true;
    this.paymentError = null;

    const formValue = this.checkoutForm.value;
    const itemsForRequest: CartItemRequest[] = this.cartItems.map(item => ({
      productId: item.id,
      cantidad: item.quantity
    }));

    try {
      const { paymentMethod, error } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.card,
        billing_details: {
          name: formValue.nombre,
          address: {
            line1: formValue.direccion,
            city: formValue.ciudad,
            postal_code: formValue.codigoPostal,
            country: 'PE',
          }
        },
      });

      if (error) {
        this.paymentError = error.message;
        this.processing = false;
        return;
      }

      const purchaseRequest: ConfirmarCompraRequest = {
        idMetodoPago: 1,
        items: itemsForRequest,
        paymentMethodId: paymentMethod.id,
        nombre: formValue.nombre,
        direccion: formValue.direccion,
        ciudad: formValue.ciudad,
        codigoPostal: formValue.codigoPostal
      };

      this.paymentService.confirmPurchase(purchaseRequest).subscribe({
        next: (response) => {
          if (response) {
            this.handleServerResponse(response);
          } else {
            this.paymentError = 'Error de comunicación con el servidor.';
            this.processing = false;
          }
        },
        error: () => {
          this.paymentError = 'Ocurrió un error inesperado al procesar el pago.';
          this.processing = false;
        }
      });
    } catch (e) {
      this.paymentError = 'Un error inesperado ocurrió.';
      this.processing = false;
    }
  }

  private async handleServerResponse(response: PedidoResponse) {
    if (response.paymentStatus === 'succeeded') {
      this.onPaymentSuccess();
    } else if (response.paymentStatus === 'requires_action' && response.clientSecret) {
      const { error } = await this.stripe.confirmCardPayment(response.clientSecret);
      if (error) {
        this.paymentError = error.message;
        this.processing = false;
      } else {
        this.onPaymentSuccess();
      }
    } else {
      this.paymentError = `El pago falló: ${response.paymentStatus}. Intenta de nuevo.`;
      this.processing = false;
    }
  }
  
  private onPaymentSuccess() {
    this.paymentSuccess = true;
    this.cartService.clearCart();
    this.router.navigate(['/confirmacion-pedido']);
  }
  
  private loadStripeScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById('stripe-script')) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.id = 'stripe-script';
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.body.appendChild(script);
    });
  }

  private initStripeCardElement(): void {
    if (this.stripe) {
      const elements = this.stripe.elements();
      this.card = elements.create('card');
      this.card.mount(this.cardElementRef.nativeElement);
      this.card.on('change', (event: any) => {
        this.paymentError = event.error ? event.error.message : null;
      });
    }
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) { this.cartSubscription.unsubscribe(); }
    if (this.card) { this.card.destroy(); }
  }
}

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CartService } from '../../../services/cart.service';
import { PaymentService } from '../../../services/payment.service';
import { CartItem } from '../../../models/product.model';
import { ConfirmarCompraRequest, PedidoResponse, CartItemRequest } from '../../../models/order.model'; // Import the new models
import { Observable, Subscription, take } from 'rxjs';

// Declares stripe globally so TypeScript recognizes it
// This assumes the Stripe.js script will be loaded.
declare var Stripe: any;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    CurrencyPipe
  ],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('cardElement') cardElementRef!: ElementRef; // Reference to the div where the Stripe card element will be mounted

  cartItems: CartItem[] = [];
  cartSubtotal: number = 0;


  loading: boolean = false;
  paymentError: string | null = null;
  paymentSuccess: boolean = false;
  processing: boolean = false;

  stripe: any;
  elements: any;
  card: any;

  fullName: string = '';
  addressLine1: string = '';
  city: string = '';
  zipCode: string = '';
  country: string = 'PE';

  selectedPaymentMethodId: number = 1;

  private cartSubscription: Subscription = new Subscription();
  private paymentIntentSubscription: Subscription = new Subscription(); // Although not directly used now, we keep the declaration in case it's needed for other Stripe purposes.

  constructor(
    private cartService: CartService,
    private paymentService: PaymentService,
    private router: Router,
    private _snackBar: MatSnackBar // To display messages to the user
  ) { }

  ngOnInit(): void {
    this.loading = true; // Start page loading

    // Subscription to cart items to display in checkout
    this.cartSubscription = this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.cartSubtotal = items.reduce((total, item) => total + (item.precio * item.quantity), 0);

      // If the cart is empty, redirect to the cart and display a message
      if (this.cartItems.length === 0 && !this.loading) { // Make sure not to redirect immediately on load
        this.router.navigate(['/carrito']);
        this.openSnackBar('Tu carrito está vacío. Añade productos para proceder al pago.', 'Ok');
      }
    });

    // Load Stripe.js dynamically
    this.loadStripeScript().then(() => {
      // Initialize Stripe with your public key
      // IMPORTANT! Replace 'ejemploxxx' with your actual Stripe public key.
      // This key is public and safe to include on the frontend.
      this.stripe = Stripe('pk_test_51RYvDlQTxkcZLSDx0KHQCoFQEikDRLTYSNSfNwzWa7O5AIQtnUooWYO4L3a2qq8p5SHP9XL2oh9Ymgm2L6QEp6fO00BVNuwVlB');
      this.elements = this.stripe.elements();
      this.loading = false; // End loading once Stripe is ready
    }).catch(error => {
      console.error('Error loading Stripe.js:', error);
      this.paymentError = 'No se pudo cargar el script de pago. Inténtalo de nuevo más tarde.';
      this.loading = false;
    });
  }

  ngAfterViewInit(): void {
    // Initialize Stripe elements once the view has been rendered
    // This ensures that #cardElement is available in the DOM
    // Small delay to ensure Stripe.js is fully loaded and `this.stripe` is initialized.
    setTimeout(() => {
      if (this.stripe && this.elements && this.cardElementRef && this.cardElementRef.nativeElement) {
        this.initStripeElements();
      } else {
        console.error('Stripe.js or cardElementRef not ready after initial load.');
        this.paymentError = 'Error al inicializar el formulario de pago. Por favor, recarga la página.';
      }
    }, 1000); // Increased delay for robustness
  }

  /**
   * Loads the Stripe.js script dynamically if not already present.
   * @returns Promise<void>
   */
  private loadStripeScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById('stripe-script')) {
        resolve(); // Script already loaded
        return;
      }

      const script = document.createElement('script');
      script.id = 'stripe-script';
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Stripe.js script.'));
      document.body.appendChild(script);
    });
  }

  /**
   * Initializes and mounts the Stripe card element in the DOM.
   */
  private initStripeElements(): void {
    // Create a card element
    this.card = this.elements.create('card', {
      style: {
        base: {
          iconColor: '#666EE8',
          color: '#313259',
          fontWeight: '300',
          fontFamily: 'Inter, sans-serif',
          fontSize: '16px',
          '::placeholder': {
            color: '#CFD7DF',
          },
        },
        invalid: {
          iconColor: '#FFC7EE',
          color: '#FFC7EE',
        },
      },
    });

    // Mount the card element to the referenced div
    this.card.mount(this.cardElementRef.nativeElement);

    // Listen for changes in the card element to display validation errors
    this.card.on('change', (event: any) => {
      this.paymentError = event.error ? event.error.message : '';
    });
  }

  /**
   * Opens a SnackBar with a message and an action.
   * @param message The message to display.
   * @param action The action for the SnackBar button.
   */
  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action, {
      duration: 3000,
    });
  }

  /**
   * Handles the submission of the payment form.
   */
  async handlePayment(): Promise<void> {
    this.processing = true; // Disable the payment button
    this.paymentError = null; // Clear previous errors
    this.paymentSuccess = false; // Reset success state

    // Check if the cart is empty
    if (this.cartItems.length === 0) {
      this.paymentError = 'Tu carrito está vacío. Por favor, añade productos antes de proceder al pago.';
      this.processing = false;
      return;
    }

    // Check if the shipping form is complete
    if (!this.fullName || !this.addressLine1 || !this.city || !this.zipCode || !this.country) {
      this.paymentError = 'Por favor, rellena todos los campos de envío.';
      this.processing = false;
      return;
    }

    // Convert cart items to the request DTO format
    const itemsForRequest: CartItemRequest[] = this.cartItems.map(item => ({
      productId: item.id,
      cantidad: item.quantity
    }));

    let paymentMethodIdFromStripe: string | undefined;

    try {
      // 1. Create a PaymentMethod with Stripe.js (This does not charge the card, it just gets a token/ID to use with the PaymentIntent)
      const { paymentMethod, error: createPaymentMethodError } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.card,
        billing_details: {
          name: this.fullName,
          address: {
            line1: this.addressLine1,
            city: this.city,
            postal_code: this.zipCode,
            country: this.country,
          }
        },
      });

      if (createPaymentMethodError) {
        this.paymentError = createPaymentMethodError.message;
        this.openSnackBar(this.paymentError || 'Error al crear el método de pago.', 'Cerrar');
        this.processing = false;
        return;
      }
      paymentMethodIdFromStripe = paymentMethod.id;

      // 2. Build the request DTO for the backend
      const purchaseRequest: ConfirmarCompraRequest = {
        idMetodoPago: this.selectedPaymentMethodId,
        items: itemsForRequest,
        paymentMethodId: paymentMethodIdFromStripe // Include the PaymentMethod ID for the backend
      };

      // 3. Call the backend service to confirm the purchase and process the payment (create PaymentIntent)
      // Corrected: Allow backendResponse to be undefined
      const backendResponse: PedidoResponse | null | undefined = await this.paymentService.confirmPurchase(purchaseRequest).toPromise();

      if (!backendResponse) {
        throw new Error('No se recibió una respuesta válida del servidor.');
      }

      // 4. Handle the backend response
      if (backendResponse.paymentStatus === 'succeeded') {
        // Payment successful directly
        this.paymentSuccess = true;
        this.paymentError = null;
        this.openSnackBar('¡Pago realizado con éxito! Redirigiendo a la página de confirmación.', 'Ok');
        this.cartService.clearCart();
        setTimeout(() => {
          this.router.navigate(['/confirmacion-pedido']);
        }, 2000);
      } else if (backendResponse.paymentStatus === 'requires_action' && backendResponse.clientSecret) {
        // Requires 3D Secure authentication or additional client action
        const { paymentIntent, error: confirmError } = await this.stripe.confirmCardPayment(backendResponse.clientSecret);

        if (confirmError) {
          this.paymentError = confirmError.message;
          this.openSnackBar(this.paymentError || 'Error durante la confirmación de pago 3D Secure.', 'Cerrar');
        } else if (paymentIntent.status === 'succeeded') {
          // 3D Secure completed successfully
          this.paymentSuccess = true;
          this.paymentError = null;
          this.openSnackBar('¡Pago 3D Secure completado con éxito! Redirigiendo a la página de confirmación.', 'Ok');
          this.cartService.clearCart();
          setTimeout(() => {
            this.router.navigate(['/confirmacion-pedido']);
          }, 2000);
        } else {
          // Another status after 3D Secure
          this.paymentError = `Estado del pago 3D Secure: ${paymentIntent.status}. Por favor, inténtalo de nuevo.`;
          // Corrected: Use || for null check
          this.openSnackBar(this.paymentError || 'Estado desconocido después de 3D Secure.', 'Cerrar');
        }
      } else if (backendResponse.paymentStatus === 'requires_payment_method' || backendResponse.paymentStatus === 'pago_fallido') {
         // The backend indicated that the payment failed or requires a different method
         this.paymentError = `El pago no pudo ser procesado. Estado: ${backendResponse.paymentStatus}. Por favor, inténtalo con otra tarjeta o método.`;
         // Corrected: Use || for null check
         this.openSnackBar(this.paymentError || 'El pago no pudo ser procesado.', 'Cerrar');
      } else {
        // Other unexpected PaymentIntent or backend statuses
        this.paymentError = `Ocurrió un problema con el pago. Estado desconocido: ${backendResponse.paymentStatus}.`;
        // Corrected: Use || for null check
        this.openSnackBar(this.paymentError || 'Estado de pago inesperado.', 'Cerrar');
      }
    } catch (err: any) {
      console.error('Error en el proceso de pago:', err);
      this.paymentError = err.message || 'Ocurrió un error inesperado al procesar el pago.';
      // Corrected: Use || for null check
      this.openSnackBar(this.paymentError || 'Ocurrió un error inesperado al procesar el pago.', 'Cerrar');
    } finally {
      this.processing = false;
    }
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    if (this.card) {
      this.card.destroy();
    }
  }
}

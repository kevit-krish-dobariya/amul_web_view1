import { Component, OnInit } from '@angular/core';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  WHATSAPP_API_URL,
  WHATSAPP_AUTH_TOKEN,
  WHATSAPP_REDIRECT_URL,
  WHATSAPP_TEMPLATE_NAME,
} from '../constants/api.constants';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
})
export class CartComponent implements OnInit {
  products: Product[] = [];
  isLoading = true;
  isSubmitting = false;

  constructor(
    private productService: ProductService,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    const orderId = this.productService.getOrderId();

    if (!orderId) {
      console.error('Order ID not found');
      this.isLoading = false;
      return;
    }

    this.productService.getOrder(orderId).subscribe({
      next: (response) => {
        this.products = this.productService.mapOrderProducts(response);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to fetch order', error);
        this.isLoading = false;
      },
    });
  }

  getCartItems(): Product[] {
    return this.products.filter((p) => p.qty.loose > 0);
  }

  getItemTotal(product: Product): number {
    return product.qty.loose * product.price.loose;
  }

  getTotal(): number {
    return this.products.reduce(
      (total, p) => total + p.qty.loose * p.price.loose,
      0,
    );
  }

  getTotalItems(): number {
    return this.productService.getTotalItems();
  }

  onSubmit(): void {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    this.productService.confirmOrder().subscribe({
      next: (res) => {
        console.log('Confirm Order Response', res);
        const contactNumber = this.productService.getContactNumber();

        if (!contactNumber) {
          console.error('Contact number not found');
          this.isSubmitting = false;
          return;
        }

        const headers = new HttpHeaders({
          accept: 'application/json',
          Authorization: WHATSAPP_AUTH_TOKEN,
          'Content-Type': 'application/json',
        });

        const orderDate = new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        const body = {
          to: contactNumber,
          type: 'template',
          source: 'external',

          template: {
            name: WHATSAPP_TEMPLATE_NAME,

            language: {
              code: 'en',
            },

            components: [
              {
                type: 'body',

                parameters: [
                  {
                    type: 'text',
                    text: this.productService.getOrderId(),
                  },
                  {
                    type: 'text',
                    text: orderDate,
                  },
                  {
                    type: 'text',
                    text: String(this.getTotalItems()),
                  },
                  {
                    type: 'text',
                    text: this.getTotal().toFixed(2),
                  },
                ],
              },
            ],
          },
        };

        this.http.post<any>(WHATSAPP_API_URL, body, { headers }).subscribe({
          next: (res) => {
            console.log('WhatsApp template sent', res);
            this.productService.clearProducts();
            window.location.href = WHATSAPP_REDIRECT_URL;
            this.isSubmitting = false;
          },

          error: (err) => {
            console.error('WhatsApp API Error', err);

            this.isSubmitting = false;
          },
        });
      },

      error: (err) => {
        console.error('Confirm Order API Error', err);
        this.isSubmitting = false;
      },
    });
  }
}

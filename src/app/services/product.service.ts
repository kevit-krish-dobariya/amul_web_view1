import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Product } from '../models/product.model';
import {
  API_TOKEN,
  CONFIRM_ORDER_URL,
  DELETE_ORDER_URL,
  GET_ORDER_URL,
  UPDATE_ORDER_URL,
} from '../constants/api.constants';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private contactNumber: string | null = null;
  private orderId: string | null = null;
  private products: Product[] = [];

  private orderInfo: {
    orderId?: string;
    customerName?: string;
    distributorName?: string;
    amount?: number;
    status?: string;
    orderDate?: string;
  } = {};

  constructor(private http: HttpClient) {}

  // =================================
  // CONTACT
  // =================================

  setContactNumber(number: string | null): void {
    this.contactNumber = number;
  }

  getContactNumber(): string | null {
    return this.contactNumber;
  }

  setOrderId(orderId: string | null): void {
    this.orderId = orderId;

    if (orderId) {
      localStorage.setItem('amul_order_id', orderId);
    }
  }

  getOrderId(): string | null {
    if (!this.orderId) {
      this.orderId = localStorage.getItem('amul_order_id');
    }
    return this.orderId;
  }

  // =================================
  // ORDER INFO
  // =================================

  getOrderInfo() {
    return this.orderInfo;
  }

  // =================================
  // MAP API RESPONSE
  // =================================

  mapOrderProducts(orderData: any): Product[] {
    this.orderInfo = {
      orderId: orderData.temp_order_no,
      customerName: orderData.customer_name,
      distributorName: orderData.distr_name,
      amount: Number(orderData.amount || 0),
      status: orderData.OrdStatus,
      orderDate: orderData.order_date,
    };

    this.products =
      orderData?.Details?.map((item: any) => {
        const fullName = item.product_name || '';

        const sizeMatch = fullName.match(
          /((?:\d+x)*\d+(?:\.\d+)?\s?(?:kg|g|gm|ml|ltr|l)(?:\s*CP)?)$/i,
        );

        const unitSize = sizeMatch?.[1] || '';

        const productName = fullName.replace(sizeMatch?.[0] || '', '').trim();

        return {
          id: item.product_code,
          name: productName,
          image: item.product_image,
          unitSize,
          piecesPerBox: 24,
          price: {
            loose: Number(item.rate || 0),
          },

          qty: {
            // API only provides ordered_qty
            loose: Number(item.ordered_qty || 0),
          },
        };
      }) || [];

    return this.products;
  }

  // =================================
  // PRODUCTS
  // =================================

  getProducts(): Product[] {
    return this.products;
  }

  updateProducts(products: Product[]): void {
    this.products = [...products];
  }

  removeProduct(productId: string): void {
    this.products = this.products.filter((product) => product.id !== productId);
  }

  clearProducts(): void {
    this.products = [];
  }

  // =================================
  // QUANTITY HELPERS
  // =================================

  getQty(productId: string, type: 'loose'): number {
    const product = this.products.find((p) => p.id === productId);

    return product ? product.qty[type] : 0;
  }

  // =================================
  // TOTALS
  // =================================

  getTotalItems(): number {
    return this.products.reduce(
      (total, product) => total + product.qty.loose,
      0,
    );
  }

  getTotalAmount(): number {
    return this.products.reduce(
      (total, product) => total + product.qty.loose * product.price.loose,
      0,
    );
  }

  getProductTotal(product: Product): number {
    return product.qty.loose * product.price.loose;
  }

  clearOrderContext(): void {
    this.products = [];
    this.orderInfo = {};

    this.contactNumber = null;
    this.orderId = null;

    localStorage.removeItem('amul_contact_number');
    localStorage.removeItem('amul_order_id');
  }

  // =================================
  // HELPERS
  // =================================

  getProductById(productId: string): Product | undefined {
    return this.products.find((p) => p.id === productId);
  }

  isProductInCart(productId: string): boolean {
    return this.products.some((p) => p.id === productId);
  }

  getOrder(orderId: string) {
    return this.http.get<any>(`${GET_ORDER_URL}/${orderId}`, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${API_TOKEN}`,
      }),
    });
  }

  updateOrder() {
    const payload = {
      order_id: this.orderInfo.orderId,
      products: this.products.map((product) => ({
        product_code: product.id,
        ordered_qty: product.qty.loose,
      })),
    };
    console.log('PAYLOAD', payload);

    return this.http.put(UPDATE_ORDER_URL, payload, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_TOKEN}`,
      }),
    });
  }

  confirmOrder() {
    return this.http.post(
      CONFIRM_ORDER_URL,
      {
        order_id: this.orderInfo.orderId,
      },
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_TOKEN}`,
        }),
      },
    );
  }

  deleteOrder() {
    const orderId = this.orderInfo.orderId;

    return this.http.delete(DELETE_ORDER_URL, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_TOKEN}`,
      }),
      body: {
        order_id: orderId,
      },
    });
  }
}

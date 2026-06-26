import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  products: Product[] = [];
  isLoading = true;

  showValidationError = false;

  showRemoveModal = false;
  selectedProduct: Product | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;

    const contactNumber =
      params['contactNumber'] || this.productService.getContactNumber();

    const orderId = params['orderId'] || this.productService.getOrderId();

    if (contactNumber) {
      this.productService.setContactNumber(contactNumber);
    }

    if (orderId) {
      this.productService.setOrderId(orderId);

      this.isLoading = true;

      this.productService.getOrder(orderId).subscribe({
        next: (response) => {
          console.log('ORDER RESPONSE', response);
          this.products = this.productService.mapOrderProducts(response);
          this.isLoading = false;
        },

        error: (error) => {
          console.error('Failed to fetch order', error);
          this.isLoading = false;
        },
      });
    } else {
      this.isLoading = false;
    }
  }

  addQty(product: Product, type: 'loose'): void {
    product.qty[type]++;

    this.productService.updateProducts(this.products);
  }

  removeQty(product: Product, type: 'loose'): void {
    if (product.qty[type] > 0) {
      product.qty[type]--;

      this.productService.updateProducts(this.products);
    }
  }

  getTotal(): number {
    return this.productService.getTotalAmount();
  }

  getTotalItems(): number {
    return this.productService.getTotalItems();
  }

  isInvalid(product: Product): boolean {
    return product.qty.loose === 0;
  }

  goToCart(): void {
    this.productService.updateOrder().subscribe({
      next: (res) => {
        console.log('RESPONSE', res);
        this.router.navigate(['/cart']);
      },
      error: (error) => {
        console.error('Failed to update order', error);

        // Optional: still allow navigation
        this.router.navigate(['/cart']);
      },
    });
  }

  // ======================
  // REMOVE PRODUCT MODAL
  // ======================

  openRemoveModal(product: Product): void {
    this.selectedProduct = product;
    this.showRemoveModal = true;
  }

  closeRemoveModal(): void {
    this.selectedProduct = null;
    this.showRemoveModal = false;
  }

  // confirmRemove(): void {
  //   if (!this.selectedProduct) {
  //     return;
  //   }

  //   this.productService.removeProduct(this.selectedProduct.id);

  //   this.products = this.productService.getProducts();

  //   this.closeRemoveModal();
  // }

  confirmRemove(): void {
    if (!this.selectedProduct) {
      return;
    }

    const productId = this.selectedProduct.id;

    // Remove locally
    this.productService.removeProduct(productId);

    // Refresh local list
    this.products = this.productService.getProducts();

    // No products left
    if (!this.products.length) {
      this.productService.deleteOrder().subscribe({
        next: (response) => {
          console.log('Order deleted', response);

          this.closeRemoveModal();
        },

        error: (error) => {
          console.error('Delete order failed', error);

          this.closeRemoveModal();
        },
      });

      return;
    }
    this.productService.updateOrder().subscribe({
      next: (response) => {
        console.log('Order updated', response);

        this.closeRemoveModal();
      },

      error: (error) => {
        console.error('Update order failed', error);

        this.closeRemoveModal();
      },
    });
  }
}

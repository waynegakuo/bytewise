import { Component, inject } from '@angular/core';
import {CurrencyPipe, NgOptimizedImage} from '@angular/common';
import { ProductService } from '../../services/product.service';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    NgOptimizedImage,
    CurrencyPipe,
    RouterLink
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  productService = inject(ProductService);

  clearCart(): void {
    this.productService.clearCart();
  }
}

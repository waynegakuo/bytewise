import { Component, inject } from '@angular/core';
import {CurrencyPipe, NgOptimizedImage} from '@angular/common';
import { ProductService } from '../../services/product.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    NgOptimizedImage,
    CurrencyPipe
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  productService = inject(ProductService);
  router = inject(Router);

  clearCart(): void {
    this.productService.clearCart();
  }

  onLogoClicked(){
    this.router.navigate(['/']);
  }
}

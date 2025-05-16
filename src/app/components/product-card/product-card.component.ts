import {Component, inject, Input} from '@angular/core';
import { Product } from '../../models/product.model';
import {NgOptimizedImage, CurrencyPipe, SlicePipe} from '@angular/common';
import {ProductService} from '../../services/product.service';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [NgOptimizedImage, CurrencyPipe, SlicePipe, RouterLink],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {
  @Input() product!: Product;

  productService = inject(ProductService);

  onAddToCartClicked(product: Product) {
    this.productService.addToCart(product);
  }
}

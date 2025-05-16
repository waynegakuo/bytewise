import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgOptimizedImage, CurrencyPipe, CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [NgOptimizedImage, CurrencyPipe, CommonModule, RouterLink],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss'
})
export class ProductDetailsComponent implements OnInit {
  product: Product | undefined;

  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);

  ngOnInit(): void {
    // Get the product slug from the route parameters
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        // Find the product with the matching slug
        const products = this.productService.getProducts();
        this.product = products.find(p => p.slug === slug);
      }
    });
  }

  onAddToCartClicked(product: Product): void {
    this.productService.addToCart(product);
  }
}

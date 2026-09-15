import {Component, inject} from '@angular/core';
import {ProductCardComponent} from "../product-card/product-card.component";
import {ProductService} from '../../services/product.service';

@Component({
  selector: 'app-home',
    imports: [
        ProductCardComponent
    ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  productService = inject(ProductService);
  products = this.productService.getProducts();
}

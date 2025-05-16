import {Component, inject} from '@angular/core';
import {AgentWindowComponent} from "../agent-window/agent-window.component";
import {NgIf} from "@angular/common";
import {ProductCardComponent} from "../product-card/product-card.component";
import {ProductService} from '../../services/product.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-home',
    imports: [
        AgentWindowComponent,
        NgIf,
        ProductCardComponent
    ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  productService = inject(ProductService);
  router = inject(Router);

  products = this.productService.getProducts();

}

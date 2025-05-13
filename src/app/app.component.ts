import {Component, inject} from '@angular/core';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { AgentWindowComponent } from './components/agent-window/agent-window.component';
import {ProductService} from './services/product.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NavbarComponent,
    ProductCardComponent,
    AgentWindowComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'bytewise';

  productService = inject(ProductService);

  products = this.productService.getProducts();
}

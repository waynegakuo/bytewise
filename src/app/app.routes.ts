import { Routes } from '@angular/router';
import { ProductDetailsComponent } from './components/product-details/product-details.component';
import {HomeComponent} from './components/home/home.component';

export const routes: Routes = [
  {path:'', component: HomeComponent},
  { path: 'product/:slug', component: ProductDetailsComponent }
];

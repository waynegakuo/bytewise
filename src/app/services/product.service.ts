import {computed, inject, Injectable, signal} from '@angular/core';
import {Product} from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  products: Product[] = [
    {
      id: 1,
      title: 'Smartphone X',
      slug: 'smartphone-x',
      description: 'The latest smartphone with advanced features and high-performance capabilities. Includes a stunning display and powerful camera system.',
      category: {
        id: 1,
        name: 'Electronics',
        slug: 'electronics',
        image: 'https://placehold.co/600x400',
        creationAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      },
      price: 129337,
      images: ['/images/products/smartphone.jpg'],
      creationAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      brand: 'TechX'
    },
    {
      id: 2,
      title: 'Wireless Headphones',
      slug: 'wireless-headphones',
      description: 'Premium wireless headphones with noise cancellation and long battery life. Perfect for music lovers and professionals.',
      category: {
        id: 1,
        name: 'Electronics',
        slug: 'electronics',
        image: 'https://placehold.co/600x400',
        creationAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      },
      price: 32334,
      images: ['/images/products/headphones.jpg'],
      creationAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      brand: 'SoundWave'
    },
    {
      id: 3,
      title: 'Smart Watch',
      slug: 'smart-watch',
      description: 'Feature-rich smart watch with health monitoring, notifications, and customizable watch faces. Water-resistant and durable design.',
      category: {
        id: 1,
        name: 'Electronics',
        slug: 'electronics',
        image: 'https://placehold.co/600x400',
        creationAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      },
      price: 45268,
      images: ['/images/products/smartwatch.jpg'],
      creationAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      brand: 'TimeSync'
    },
    {
      id: 4,
      title: 'Laptop Pro',
      slug: 'laptop-pro',
      description: 'High-performance laptop with the latest processor, ample storage, and stunning display. Perfect for professionals and gamers alike.',
      category: {
        id: 1,
        name: 'Electronics',
        slug: 'electronics',
        image: 'https://placehold.co/600x400',
        creationAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      },
      price: 194009,
      images: ['/images/products/laptop.jpg'],
      creationAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      brand: 'PowerBook'
    },
    {
      id: 5,
      title: 'Bluetooth Speaker',
      slug: 'bluetooth-speaker',
      description: 'Portable Bluetooth speaker with exceptional sound quality and long battery life. Water-resistant design makes it perfect for outdoor use.',
      category: {
        id: 1,
        name: 'Electronics',
        slug: 'electronics',
        image: 'https://placehold.co/600x400',
        creationAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      },
      price: 16813,
      images: ['/images/products/speaker.jpg'],
      creationAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      brand: 'AudioMax'
    },
    {
      id: 6,
      title: 'Digital Camera',
      slug: 'digital-camera',
      description: 'Professional-grade digital camera with high-resolution sensor and advanced features. Capture stunning photos and videos with ease.',
      category: {
        id: 1,
        name: 'Electronics',
        slug: 'electronics',
        image: 'https://placehold.co/600x400',
        creationAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      },
      price: 103471,
      images: ['/images/products/camera.jpg'],
      creationAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      brand: 'PixelPro'
    },
    {
      id: 7,
      title: 'Gaming Console',
      slug: 'gaming-console',
      description: 'Next-generation gaming console with powerful hardware and immersive gaming experience. Includes a controller and popular game titles.',
      category: {
        id: 1,
        name: 'Electronics',
        slug: 'electronics',
        image: 'https://placehold.co/600x400',
        creationAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      },
      price: 64669,
      images: ['/images/products/gaming-console.jpg'],
      creationAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      brand: 'GameSphere'
    },
    {
      id: 8,
      title: 'Tablet Pro',
      slug: 'tablet-pro',
      description: 'Versatile tablet with high-resolution display and powerful performance. Perfect for productivity, entertainment, and creative work.',
      category: {
        id: 1,
        name: 'Electronics',
        slug: 'electronics',
        image: 'https://placehold.co/600x400',
        creationAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      },
      price: 90537,
      images: ['/images/products/tablet.jpg'],
      creationAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      brand: 'SlateEdge'
    }
  ];

  readonly productCart = signal<Product[]>([]);
  readonly productCartTotal = computed(() => {
    return this.productCart().reduce((acc, product) => {
      return acc + product.price
    },0);
  });

  readonly cartItemCount = computed(() => {
    return this.productCart().length;
  });

  constructor() { }
  getCart(): Product[] {
    return this.productCart();
  }

  getProducts(): Product[] {
    return this.products;
  }

  addToCart(product: Product): void {
    this.productCart.update((cart) => {
      return [...cart, product];
    });
  }

  clearCart(): void {
    this.productCart.set([]);
  }

}

export interface Product {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: Category;
  price: number;
  images: string[];
  creationAt: string;
  updatedAt: string;
  brand?: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  image: string;
  creationAt: string;
  updatedAt: string;
}

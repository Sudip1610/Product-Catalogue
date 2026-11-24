// Domain model – Product
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  imageUrl: string;
  rating: { average: number; count: number };
}

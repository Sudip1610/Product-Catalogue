export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  imageUrl: string;
  rating: {
    average: number;
    count: number;
  };
}

export interface CategoryItem {
  slug: string;
  name: string;
}

export interface CategoryView {
  category: string;
  topRated: Product[];
  others: Product[];
}

export interface EnquiryInput {
  productId: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  website?: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Domain ports (interfaces)
import type { Product } from './product.js';

export interface ProductRepository {
  listAll(): Promise<Product[]>;
  getById(id: string): Promise<Product | null>;
  listCategories(): Promise<string[]>;
}

export interface EmailMessage {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

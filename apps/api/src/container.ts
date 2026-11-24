// Composition root – the ONLY place that wires concrete adapters to ports.
// Services and routes depend on interfaces; this file knows about implementations.

import { config } from './config.js';
import { FakeStoreProductRepository } from './adapters/fakeStoreProductRepository.js';
import { CachingProductRepository } from './adapters/cachingProductRepository.js';
import { SmtpEmailSender } from './adapters/smtpEmailSender.js';
import { ProductService } from './services/productService.js';
import { EnquiryService } from './services/enquiryService.js';

function buildContainer() {
  const fakeStoreRepo = new FakeStoreProductRepository({
    baseUrl: config.FAKESTORE_BASE_URL,
    currency: config.DEFAULT_CURRENCY,
  });

  const productRepo = new CachingProductRepository(fakeStoreRepo, config.PRODUCT_CACHE_TTL_SECONDS);

  const emailSender = new SmtpEmailSender({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
    from: config.MAIL_FROM,
  });

  const productService = new ProductService(productRepo, {
    featuredProductIds: config.FEATURED_PRODUCT_IDS,
    categoryTopRatedCount: config.CATEGORY_TOP_RATED_COUNT,
  });

  const enquiryService = new EnquiryService(productService, emailSender, config.SALES_INBOX_EMAIL);

  return { productService, enquiryService, config };
}

export const container = buildContainer();

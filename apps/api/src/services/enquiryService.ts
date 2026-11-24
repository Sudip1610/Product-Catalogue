import type { EmailSender } from '../domain/ports.js';
import type { Enquiry } from '../domain/enquiry.js';
import { EmailDeliveryError } from '../domain/errors.js';
import type { ProductService } from './productService.js';

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export class EnquiryService {
  constructor(
    private readonly productService: ProductService,
    private readonly emailSender: EmailSender,
    private readonly salesInbox: string,
  ) {}

  async submit(enquiry: Enquiry): Promise<void> {
    // Confirm product exists – throws NotFoundError if not
    const product = await this.productService.getById(enquiry.productId);

    // Build safe subject: product title comes from our DB (trusted), id is safe
    const subject = `New enquiry: ${product.title} (#${product.id})`;

    // Safe text body – user input escaped for plain text via trimming only
    // (no HTML injection possible in text/plain)
    const textBody = [
      `Product: ${product.title} (ID: ${product.id})`,
      `Price: ${product.currency} ${product.price}`,
      '',
      `Customer name:    ${enquiry.name}`,
      `Customer email:   ${enquiry.email}`,
      `Customer phone:   ${enquiry.phone ?? '—'}`,
      '',
      `Message:`,
      enquiry.message,
    ].join('\n');

    // Safe HTML body – every piece of user input is HTML-escaped
    const htmlBody = `
<h2>New product enquiry</h2>
<table>
  <tr><th>Product</th><td>${escapeHtml(product.title)} (ID: ${escapeHtml(product.id)})</td></tr>
  <tr><th>Price</th><td>${escapeHtml(product.currency)} ${product.price}</td></tr>
</table>
<h3>Customer details</h3>
<table>
  <tr><th>Name</th><td>${escapeHtml(enquiry.name)}</td></tr>
  <tr><th>Email</th><td>${escapeHtml(enquiry.email)}</td></tr>
  <tr><th>Phone</th><td>${escapeHtml(enquiry.phone ?? '—')}</td></tr>
</table>
<h3>Message</h3>
<pre>${escapeHtml(enquiry.message)}</pre>
`.trim();

    try {
      await this.emailSender.send({
        to: this.salesInbox,
        // replyTo uses the customer's email – this is a header value,
        // but Nodemailer handles header injection safely for replyTo.
        replyTo: enquiry.email,
        subject,
        text: textBody,
        html: htmlBody,
      });
    } catch (err) {
      if (err instanceof EmailDeliveryError) throw err;
      throw new EmailDeliveryError('Failed to deliver enquiry email', err);
    }
  }
}

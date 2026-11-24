import { describe, it, expect, beforeEach } from 'vitest';
import { EnquiryService } from './enquiryService.js';
import { ProductService } from './productService.js';
import { EmailDeliveryError, NotFoundError } from '../domain/errors.js';
import { FakeProductRepository, FakeEmailSender, makeProduct, resetIdCounter } from '../../test/fakes.js';

const cfg = { featuredProductIds: [], categoryTopRatedCount: 3 };

function makeServices(products = [makeProduct({ id: '1', title: 'Test Widget', currency: 'USD' })]) {
  resetIdCounter();
  const repo = new FakeProductRepository(products);
  const productSvc = new ProductService(repo, cfg);
  const emailSender = new FakeEmailSender();
  const enquirySvc = new EnquiryService(productSvc, emailSender, 'sales@example.local');
  return { productSvc, emailSender, enquirySvc };
}

const baseEnquiry = {
  productId: '1',
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '+44 7700 900000',
  message: 'Is this in stock?',
};

describe('EnquiryService.submit', () => {
  beforeEach(() => resetIdCounter());

  it('sends an email to the sales inbox with product and customer info', async () => {
    const { emailSender, enquirySvc } = makeServices();

    await enquirySvc.submit(baseEnquiry);

    expect(emailSender.sent).toHaveLength(1);
    const msg = emailSender.sent[0]!;
    expect(msg.to).toBe('sales@example.local');
    expect(msg.subject).toBe('New enquiry: Test Widget (#1)');
    expect(msg.text).toContain('Jane Smith');
    expect(msg.text).toContain('jane@example.com');
    expect(msg.text).toContain('+44 7700 900000');
    expect(msg.text).toContain('Is this in stock?');
  });

  it('sets replyTo to the customer email', async () => {
    const { emailSender, enquirySvc } = makeServices();

    await enquirySvc.submit(baseEnquiry);

    expect(emailSender.sent[0]?.replyTo).toBe('jane@example.com');
  });

  it('HTML-escapes user input in the HTML body', async () => {
    const { emailSender, enquirySvc } = makeServices();

    await enquirySvc.submit({
      ...baseEnquiry,
      name: '<script>alert("xss")</script>',
      message: 'Hello <b>world</b> & "quoted"',
    });

    const html = emailSender.sent[0]?.html ?? '';
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&amp;');
    expect(html).toContain('&quot;');
  });

  it('shows dash when phone is not provided', async () => {
    const { emailSender, enquirySvc } = makeServices();
    const { phone: _phone, ...noPhone } = baseEnquiry;

    await enquirySvc.submit(noPhone);

    expect(emailSender.sent[0]?.text).toContain('—');
  });

  it('throws NotFoundError when the product does not exist', async () => {
    const { emailSender, enquirySvc } = makeServices([]);

    await expect(enquirySvc.submit({ ...baseEnquiry, productId: '999' })).rejects.toThrow(
      NotFoundError,
    );
    expect(emailSender.sent).toHaveLength(0);
  });

  it('wraps sender failure in EmailDeliveryError', async () => {
    const { emailSender, enquirySvc } = makeServices();
    emailSender.failWith('Connection refused');

    await expect(enquirySvc.submit(baseEnquiry)).rejects.toThrow(EmailDeliveryError);
  });

  it('does not send email when product lookup fails', async () => {
    const { emailSender, enquirySvc } = makeServices([]);

    try {
      await enquirySvc.submit({ ...baseEnquiry, productId: 'missing' });
    } catch {
      // expected
    }

    expect(emailSender.sent).toHaveLength(0);
  });
});

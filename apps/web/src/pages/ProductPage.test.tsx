import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../test/server.js';
import { ProductPage } from './ProductPage.js';
import { renderWithProviders } from '../test/test-utils.js';

describe('ProductPage & Enquiry Flow', () => {
  const renderProductPage = () => {
    return renderWithProviders(
      <Routes>
        <Route path="/product/:id" element={<ProductPage />} />
      </Routes>,
      { route: '/product/1' },
    );
  };

  it('renders product details correctly', async () => {
    renderProductPage();

    expect(await screen.findByRole('heading', { level: 1, name: 'Fjallraven Backpack' })).toBeInTheDocument();
    expect(screen.getByText(/USD 109.95/i)).toBeInTheDocument();
    expect(screen.getByText(/Your perfect pack for everyday use/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enquire about product/i })).toBeInTheDocument();
  });

  it('opens enquiry modal and shows client-side validation errors on empty required fields', async () => {
    const user = userEvent.setup();
    renderProductPage();

    const enquireBtn = await screen.findByRole('button', { name: /enquire about product/i });
    await user.click(enquireBtn);

    // Modal dialog is open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /enquire: fjallraven backpack/i })).toBeInTheDocument();

    // Clear prefilled message and click submit
    const messageInput = screen.getByLabelText(/message \*/i);
    await user.clear(messageInput);

    const submitBtn = screen.getByRole('button', { name: /send enquiry/i });
    await user.click(submitBtn);

    // Validation messages appear
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    expect(screen.getByText(/message is required/i)).toBeInTheDocument();
  });

  it('successful submit replaces form with Thank you message', async () => {
    const user = userEvent.setup();
    renderProductPage();

    await user.click(await screen.findByRole('button', { name: /enquire about product/i }));

    // Fill valid form
    await user.type(screen.getByLabelText(/your name \*/i), 'John Doe');
    await user.type(screen.getByLabelText(/email address \*/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone number/i), '+1 555-1234');

    const submitBtn = screen.getByRole('button', { name: /send enquiry/i });
    await user.click(submitBtn);

    // Expect Thank you message
    expect(await screen.findByRole('heading', { level: 3, name: /thank you!/i })).toBeInTheDocument();
    expect(screen.getByText(/your enquiry for/i)).toBeInTheDocument();
  });

  it('API failure shows error banner, keeps entered data, and allows retry', async () => {
    const user = userEvent.setup();

    // Mock API failure for enquiries
    server.use(
      http.post('/api/v1/enquiries', () => {
        return HttpResponse.json(
          { error: { code: 'EMAIL_DELIVERY_FAILED', message: 'Failed to deliver enquiry email' } },
          { status: 502 },
        );
      }),
    );

    renderProductPage();

    await user.click(await screen.findByRole('button', { name: /enquire about product/i }));

    const nameInput = screen.getByLabelText(/your name \*/i);
    const emailInput = screen.getByLabelText(/email address \*/i);

    await user.type(nameInput, 'Jane Smith');
    await user.type(emailInput, 'jane@example.com');

    const submitBtn = screen.getByRole('button', { name: /send enquiry/i });
    await user.click(submitBtn);

    // Error banner appears
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/failed to deliver enquiry email/i)).toBeInTheDocument();

    // Data is kept!
    expect(nameInput).toHaveValue('Jane Smith');
    expect(emailInput).toHaveValue('jane@example.com');

    // No Thank you message shown
    expect(screen.queryByText(/thank you!/i)).not.toBeInTheDocument();

    // Now restore server to succeed and retry
    server.use(
      http.post('/api/v1/enquiries', () => {
        return HttpResponse.json({ status: 'sent' }, { status: 201 });
      }),
    );

    await user.click(submitBtn);

    // On retry with working API, now shows Thank you
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: /thank you!/i })).toBeInTheDocument();
    });
  });
});

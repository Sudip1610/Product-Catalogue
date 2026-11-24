import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { enquiryFormSchema, type EnquiryFormValues } from './enquirySchema.js';
import { useSubmitEnquiry } from '../../hooks/useSubmitEnquiry.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Textarea } from '../../components/ui/Textarea.js';
import { ErrorMessage } from '../../components/ui/ErrorMessage.js';
import { Spinner } from '../../components/ui/Spinner.js';

export interface EnquiryFormProps {
  productId: string;
  productTitle: string;
  onSuccess?: () => void;
}

export const EnquiryForm: React.FC<EnquiryFormProps> = ({
  productId,
  productTitle,
  onSuccess,
}) => {
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquiryFormSchema),
    defaultValues: {
      productId,
      name: '',
      email: '',
      phone: '',
      message: `I would like to enquire about ${productTitle}.`,
      website: '',
    },
  });

  const { mutate, isPending, error, reset: resetMutation } = useSubmitEnquiry();

  const onSubmit = (values: EnquiryFormValues) => {
    resetMutation();
    mutate(
      {
        productId: values.productId,
        name: values.name,
        email: values.email,
        phone: values.phone ? values.phone : undefined,
        message: values.message,
        website: values.website,
      },
      {
        onSuccess: () => {
          setIsSubmittedSuccess(true);
          onSuccess?.();
        },
      },
    );
  };

  if (isSubmittedSuccess) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          textAlign: 'center',
          padding: 'var(--space-6) var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-3)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-success-subtle)',
            color: 'var(--color-success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-2xl)',
          }}
        >
          ✓
        </div>
        <h3 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-text-main)' }}>
          Thank you!
        </h3>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '380px' }}>
          Your enquiry for <strong>{productTitle}</strong> has been sent to our sales team. We will be in touch shortly.
        </p>
      </div>
    );
  }

  const formStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={formStyle} noValidate>
      {error && (
        <ErrorMessage
          message={error.message || 'Failed to submit enquiry. Please try again.'}
        />
      )}

      {/* Honeypot field - visually hidden */}
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register('website')}
        />
      </div>

      <input type="hidden" {...register('productId')} />

      <Input
        label="Your Name *"
        id="name"
        type="text"
        placeholder="Jane Smith"
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="Email Address *"
        id="email"
        type="email"
        placeholder="jane@example.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Phone Number (Optional)"
        id="phone"
        type="tel"
        placeholder="+1 (555) 000-0000"
        error={errors.phone?.message}
        {...register('phone')}
      />

      <Textarea
        label="Message *"
        id="message"
        rows={4}
        placeholder="Write your enquiry here..."
        error={errors.message?.message}
        {...register('message')}
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isPending}
        style={{ marginTop: 'var(--space-2)' }}
      >
        {isPending ? (
          <>
            <Spinner size="sm" ariaLabel="Sending enquiry..." />
            <span style={{ marginLeft: 'var(--space-2)' }}>Sending...</span>
          </>
        ) : (
          'Send Enquiry'
        )}
      </Button>
    </form>
  );
};

// Typed domain errors

export class NotFoundError extends Error {
  readonly code = 'NOT_FOUND' as const;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UpstreamError extends Error {
  readonly code = 'UPSTREAM_ERROR' as const;
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'UpstreamError';
  }
}

export class EmailDeliveryError extends Error {
  readonly code = 'EMAIL_DELIVERY_FAILED' as const;
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'EmailDeliveryError';
  }
}

export class ValidationError extends Error {
  readonly code = 'VALIDATION_ERROR' as const;
  constructor(
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

import 'server-only';

export type NormalizedProviderError = {
  code: string;
  message: string;
  retryable: boolean;
};

export class ProviderPublishError extends Error {
  readonly normalized: NormalizedProviderError;

  constructor(error: NormalizedProviderError) {
    super(error.message);
    this.name = 'ProviderPublishError';
    this.normalized = error;
  }
}

export function normalizeProviderError(
  error: unknown,
): NormalizedProviderError {
  if (error instanceof ProviderPublishError) {
    return error.normalized;
  }

  if (error instanceof Error) {
    return {
      code: 'provider_error',
      message: error.message,
      retryable: false,
    };
  }

  return {
    code: 'unknown_provider_error',
    message: 'The provider request failed.',
    retryable: false,
  };
}

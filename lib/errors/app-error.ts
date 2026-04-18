export type AppErrorCode =
  | "request_failed"
  | "validation_failed"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "provider_failed"
  | "unknown";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;

  constructor({
    code,
    message,
    status = 500,
  }: {
    code: AppErrorCode;
    message: string;
    status?: number;
  }) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

export function normalizeError(error: unknown) {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError({
      code: "unknown",
      message: error.message,
      status: 500,
    });
  }

  return new AppError({
    code: "unknown",
    message: "An unknown error occurred.",
    status: 500,
  });
}

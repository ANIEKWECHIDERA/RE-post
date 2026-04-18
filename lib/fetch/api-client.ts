import { AppError, normalizeError } from "@/lib/errors/app-error";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type ApiClientOptions = Omit<RequestInit, "body"> & {
  body?: JsonValue | FormData;
};

export async function apiFetch<T>(input: string, options: ApiClientOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const body = options.body instanceof FormData ? options.body : JSON.stringify(options.body);

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(input, {
    ...options,
    headers,
    body,
  });

  if (!response.ok) {
    throw new AppError({
      code: "request_failed",
      message: "The request could not be completed.",
      status: response.status,
    });
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw normalizeError(error);
  }
}

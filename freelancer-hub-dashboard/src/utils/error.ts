/* eslint-disable @typescript-eslint/no-explicit-any */
export type ErrorWithMessage = {
  errors?: [
    {
      reason: string;
      message: string;
    }
  ];
  message?: string;
};

export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === "object" &&
    error !== null &&
    (("message" in error &&
      typeof (error as Record<string, unknown>).message === "string") ||
      ("errors" in error && Array.isArray(error.errors)))
  );
}

export function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) {
    return maybeError;
  }

  if ((maybeError as any)?.response?.data?.error) {
    return new Error((maybeError as any)?.response?.data?.error);
  }

  try {
    return new Error(
      typeof maybeError === "string" ? maybeError : JSON.stringify(maybeError)
    );
  } catch {
    // fallback in case there's an error stringifying the maybeError
    // like with circular references for example.
    return new Error(String(maybeError));
  }
}

export function getErrorMessage(error: unknown) {
  return (
    toErrorWithMessage(error)?.errors?.[0]?.message ||
    toErrorWithMessage(error)?.message
  );
}

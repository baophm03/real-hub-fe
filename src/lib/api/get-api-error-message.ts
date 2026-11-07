type ErrorPayload = {
  error?: { message?: unknown };
  message?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getApiErrorMessage(error: unknown): string | undefined {
  if (!isRecord(error) || !isRecord(error.response)) return undefined;

  const payload = error.response.data;
  if (!isRecord(payload)) return undefined;

  const body = payload as ErrorPayload;
  const nestedError = isRecord(body.error) ? body.error : undefined;
  const message = nestedError?.message ?? body.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) {
    const messages = message.filter((item): item is string => typeof item === "string");
    return messages.length ? messages.join(" · ") : undefined;
  }
  return undefined;
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (!isRecord(error) || !isRecord(error.response)) return undefined;

  const payload = error.response.data;
  if (!isRecord(payload)) return undefined;

  const nestedError = isRecord(payload.error) ? payload.error : undefined;
  const code = nestedError?.errorCode ?? nestedError?.code ?? payload.errorCode ?? payload.code;
  return typeof code === "string" ? code : undefined;
}

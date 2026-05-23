export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; baseMs?: number } = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 4;
  const baseMs = options.baseMs ?? 400;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts - 1) break;
      const delay = baseMs * 2 ** attempt + Math.random() * 100;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError;
}

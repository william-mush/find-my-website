/**
 * Fetch with timeout utility
 * Prevents API calls from hanging indefinitely
 */

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

/**
 * Run a promise with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback?: T
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]).catch((error) => {
    if (fallback !== undefined) {
      console.warn(`Operation timed out, using fallback:`, error);
      return fallback;
    }
    throw error;
  });
}

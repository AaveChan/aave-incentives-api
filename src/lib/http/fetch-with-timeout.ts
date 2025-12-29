import { HTTP_CONFIG } from '@/config/http.js';

export async function fetchWithTimeout(
  url: string,
  timeoutMs: number = HTTP_CONFIG.HEALTH_CHECK_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

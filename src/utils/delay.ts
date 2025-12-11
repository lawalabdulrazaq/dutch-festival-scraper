/**
 * Delay execution for specified milliseconds
 */
export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Random delay between min and max milliseconds
 */
export function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delayMs = Math.random() * (maxMs - minMs) + minMs;
  return delay(delayMs);
}

/**
 * Exponential backoff delay for retries
 */
export function exponentialBackoff(attemptNumber: number): Promise<void> {
  const delayMs = Math.min(1000 * Math.pow(2, attemptNumber), 30000);
  return delay(delayMs + Math.random() * 1000);
}

export default { delay, randomDelay, exponentialBackoff };

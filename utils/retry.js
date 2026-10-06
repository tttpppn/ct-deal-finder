import { logger } from './logger.js';

export async function retryWithBackoff(fn, options = {}) {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
  } = options;

  let lastError;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        const waitTime = Math.min(delay, maxDelayMs);
        logger.warn(`Attempt ${attempt}/${maxAttempts} failed, retrying in ${waitTime}ms`, {
          error: error.message,
        });

        await new Promise(resolve => setTimeout(resolve, waitTime));
        delay = Math.min(delay * backoffMultiplier, maxDelayMs);
      }
    }
  }

  logger.error(`All ${maxAttempts} attempts failed`, { error: lastError.message });
  throw lastError;
}

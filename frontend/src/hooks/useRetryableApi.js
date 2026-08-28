import { useState, useCallback, useEffect, useRef } from "react";
import { logError } from "../utils/logger";
function getSecureRandom(max = 1) {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const randomBytes = new Uint32Array(1);
    crypto.getRandomValues(randomBytes);
    return (randomBytes[0] / 0xffffffff) * max;
  }
  throw new Error("A secure random number generator is required for retry jitter");
}
function isTransientError(error) {
  if (!error) return false;
  const msg = typeof error === "string" ? error : error.message || "";
  const status = error.status || error.response?.status;
  if (status && status >= 400 && status < 500 && status !== 429 && status !== 408) {
    return false;
  }
  if (status === 429 || status === 408 || status === 500 || status === 502 || status === 503 || status === 504 || msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("network error") || msg.includes("timeout") || msg.includes("ECONNRESET") || msg.includes("ETIMEDOUT") || msg.includes("AbortError")) {
    return true;
  }
  return status >= 500;
}
async function executeWithRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelayMs = 800,
    backoffFactor = 2,
    maxDelayMs = 8e3,
    retryCondition = isTransientError,
    onRetry
  } = options;
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      const shouldRetry = attempt <= maxRetries && retryCondition(err);
      if (!shouldRetry) {
        throw err;
      }
      const exponentialDelay = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
      const jitter = getSecureRandom(200);
      const delayMs = Math.min(maxDelayMs, exponentialDelay + jitter);
      if (onRetry) {
        onRetry(attempt, delayMs, err);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
function useRetryableApi(apiFn, options = {}) {
  const {
    maxRetries = 3,
    initialDelayMs = 1e3,
    backoffFactor = 2,
    maxDelayMs = 1e4,
    immediate = false,
    retryCondition = isTransientError,
    onSuccess,
    onError,
    logErrors = true
  } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const lastArgsRef = useRef(null);
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const execute = useCallback(
    async (...args) => {
      lastArgsRef.current = args;
      setLoading(true);
      setError(null);
      setIsRetrying(false);
      setRetryCount(0);
      try {
        const result = await executeWithRetry(
          () => apiFn(...args),
          {
            maxRetries,
            initialDelayMs,
            backoffFactor,
            maxDelayMs,
            retryCondition,
            onRetry: (attempt, delayMs, retryErr) => {
              if (isMountedRef.current) {
                setIsRetrying(true);
                setRetryCount(attempt);
              }
              console.warn(
                `[API Retry] Attempt ${attempt}/${maxRetries} after transient failure. Retrying in ${Math.round(delayMs)}ms...`,
                retryErr
              );
            }
          }
        );
        if (isMountedRef.current) {
          setData(result);
          setLoading(false);
          setIsRetrying(false);
        }
        if (onSuccess) {
          onSuccess(result);
        }
        return result;
      } catch (err) {
        const normalizedError = err instanceof Error ? err : new Error(String(err));
        if (isMountedRef.current) {
          setError(normalizedError);
          setLoading(false);
          setIsRetrying(false);
        }
        if (logErrors) {
          logError(normalizedError, {
            errorType: "api_error",
            metadata: {
              functionName: apiFn.name || "anonymous_api_fn",
              args: args.length > 0 ? String(args[0]) : void 0,
              retriesAttempted: retryCount
            }
          });
        }
        if (onError) {
          onError(normalizedError);
        }
        return null;
      }
    },
    [apiFn, maxRetries, initialDelayMs, backoffFactor, maxDelayMs, retryCondition, onSuccess, onError, logErrors, retryCount]
  );
  const refetch = useCallback(() => {
    if (lastArgsRef.current) {
      return execute(...lastArgsRef.current);
    }
    return execute();
  }, [execute]);
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    setIsRetrying(false);
    setRetryCount(0);
  }, []);
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate]);
  return {
    data,
    loading,
    error,
    isRetrying,
    retryCount,
    maxRetries,
    execute,
    refetch,
    reset,
    setData
  };
}
export {
  executeWithRetry,
  isTransientError,
  useRetryableApi
};

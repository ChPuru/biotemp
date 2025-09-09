import { useState, useCallback } from 'react';

interface ErrorState {
  error: Error | null;
  isError: boolean;
  errorMessage: string;
}

interface UseErrorHandlerReturn {
  error: ErrorState;
  handleError: (error: Error | string) => void;
  clearError: () => void;
  withErrorHandling: <T extends any[], R>(
    fn: (...args: T) => Promise<R>
  ) => (...args: T) => Promise<R | null>;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<ErrorState>({
    error: null,
    isError: false,
    errorMessage: ''
  });

  const handleError = useCallback((errorInput: Error | string) => {
    const errorObj = typeof errorInput === 'string' ? new Error(errorInput) : errorInput;
    
    setError({
      error: errorObj,
      isError: true,
      errorMessage: errorObj.message
    });

    // Log error for debugging
    console.error('Error handled:', errorObj);

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      logErrorToService(errorObj);
    }
  }, []);

  const clearError = useCallback(() => {
    setError({
      error: null,
      isError: false,
      errorMessage: ''
    });
  }, []);

  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>
  ) => {
    return async (...args: T): Promise<R | null> => {
      try {
        clearError();
        return await fn(...args);
      } catch (error) {
        handleError(error as Error);
        return null;
      }
    };
  }, [handleError, clearError]);

  return {
    error,
    handleError,
    clearError,
    withErrorHandling
  };
};

const logErrorToService = (error: Error) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    userId: localStorage.getItem('userId') || 'anonymous'
  };

  // Example: send to error monitoring endpoint
  fetch('/api/log-client-error', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
    },
    body: JSON.stringify(errorData)
  }).catch(err => {
    console.error('Failed to log error to service:', err);
  });
};

export default useErrorHandler;

/**
 * Digital Payment Safety Assistant - Centralized API Client
 * Provides timeout handling, offline detection, and uniform error mapping.
 */

const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.VITE_API_BASE_URL) ||
  'http://localhost:8000/api';

const DEFAULT_TIMEOUT_MS = 8000;

export class ApiError extends Error {
  constructor(message, status = null, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Core fetch wrapper with timeout and error classification
 */
export async function request(endpoint, options = {}) {
  // Check browser offline status (only in browser environment)
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new ApiError(
      'You appear to be offline. Please verify your network connection and try again.',
      null,
      'OFFLINE'
    );
  }

  const { timeout = DEFAULT_TIMEOUT_MS, headers = {}, ...fetchOptions } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!response.ok) {
      let errorMessage = `Server responded with status ${response.status}.`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail);
        }
      } catch {
        // Fallback to HTTP status text
        if (response.statusText) {
          errorMessage = `${response.status} ${response.statusText}`;
        }
      }

      if (response.status === 429) {
        throw new ApiError(
          'Too many requests sent in a short period. Please pause for a moment before trying again.',
          429,
          'RATE_LIMITED'
        );
      }

      if (response.status === 404) {
        throw new ApiError('The requested safety endpoint was not found on the server.', 404, 'NOT_FOUND');
      }

      if (response.status >= 500) {
        throw new ApiError(
          'The safety assessment service is currently experiencing high load or a temporary error. Please try again shortly.',
          response.status,
          'SERVER_ERROR'
        );
      }

      throw new ApiError(errorMessage, response.status, 'REQUEST_FAILED');
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timer);

    if (err.name === 'AbortError') {
      throw new ApiError(
        'Request timed out. The safety analysis service took too long to respond. Please check your connection and retry.',
        408,
        'TIMEOUT'
      );
    }

    if (err instanceof ApiError) {
      throw err;
    }

    // Network / CORS / DNS failure
    throw new ApiError(
      'Unable to connect to the safety assistant service. Ensure the local backend server is running on http://localhost:8000.',
      null,
      'NETWORK_ERROR'
    );
  }
}

export const apiClient = {
  /**
   * Submit text message for safety analysis (supports /check/text and /analyze)
   */
  async checkText(payload, options = {}) {
    return request('/check/text', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...options
    });
  },

  /**
   * Dedicated analyze message endpoint
   */
  async analyzeMessage(payload, options = {}) {
    return request('/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...options
    });
  },

  /**
   * Submit guided Q&A answers for safety analysis
   */
  async checkGuided(payload, options = {}) {
    return request('/check/guided', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...options
    });
  },

  /**
   * Inspect a link / URL (supports /check/url and /analyze-url)
   */
  async checkUrl(payload, options = {}) {
    return request('/check/url', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...options
    });
  },

  /**
   * Dedicated analyze URL endpoint
   */
  async analyzeUrl(payload, options = {}) {
    return request('/analyze-url', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...options
    });
  },

  /**
   * Inspect a QR code payload
   */
  async checkQr(payload, options = {}) {
    return request('/check/qr', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...options
    });
  },

  /**
   * Submit user feedback
   */
  async submitFeedback(payload, options = {}) {
    return request('/feedback', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...options
    });
  },

  /**
   * Fetch demonstration scenarios
   */
  async fetchScenarios(options = {}) {
    return request('/scenarios', {
      method: 'GET',
      ...options
    });
  },

  /**
   * Health check
   */
  async fetchHealth(options = {}) {
    return request('/health', {
      method: 'GET',
      ...options
    });
  }
};

export default apiClient;

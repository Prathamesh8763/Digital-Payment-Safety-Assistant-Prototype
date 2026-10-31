/**
 * Digital Payment Safety Assistant - Centralized API Client
 * Provides timeout handling, offline detection, and uniform error mapping.
 */

const API_BASE = 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.VITE_API_BASE_URL) ||
  'http://localhost:8000/api';

const DEFAULT_TIMEOUT_MS = 45000;

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
    const cleanBase = (API_BASE || '').replace(/\/+$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = endpoint.startsWith('http') ? endpoint : `${cleanBase}${cleanEndpoint}`;
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
        'The safety analysis service took too long to respond. On free-tier cloud hosting (Render), the backend server may take up to 45 seconds to wake up from idle sleep on the first request. Please wait a moment and try again.',
        408,
        'TIMEOUT'
      );
    }

    if (err instanceof ApiError) {
      throw err;
    }

    // Network / CORS / DNS failure
    const isLocalhost = API_BASE.includes('localhost') || API_BASE.includes('127.0.0.1');
    const networkMsg = isLocalhost
      ? 'Unable to connect to the safety assistant service. Ensure the local backend server is running on http://localhost:8000.'
      : 'Unable to reach the safety assistant service. The backend server may be waking up from idle sleep or temporarily unreachable. Please retry in a few moments.';

    throw new ApiError(
      networkMsg,
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
   * V10 Dedicated Check Link endpoint
   */
  async checkLink(payload, options = {}) {
    return request('/check-link', {
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
  },

  /**
   * Fetch verified directory of payment gateways and subscription platforms
   */
  async fetchDirectory(options = {}) {
    return request('/directory', {
      method: 'GET',
      ...options
    });
  },

  /**
   * Analyze subscription renewal message or invoice
   */
  async analyzeSubscription(payload, options = {}) {
    return request('/subscriptions/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...options
    });
  },

  /**
   * Fetch Indian digital payment scam awareness guide
   */
  async fetchScamGuide(options = {}) {
    return request('/scam-guide', {
      method: 'GET',
      ...options
    });
  },

  /**
   * Fetch official Indian cybercrime reporting directory
   */
  async fetchReportingGuide(options = {}) {
    return request('/reporting-guide', {
      method: 'GET',
      ...options
    });
  },

  /**
   * Background health ping to pre-warm sleep instances on Render
   */
  async pingHealth(options = {}) {
    try {
      return await request('/health', {
        method: 'GET',
        timeout: 45000,
        ...options
      });
    } catch {
      return null;
    }
  }
};

export default apiClient;

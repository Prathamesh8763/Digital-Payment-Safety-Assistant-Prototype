import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, apiClient } from '../services/apiClient.js';

test('ApiError: constructor sets message, status, code, and name', () => {
  const err = new ApiError('Rate limit exceeded', 429, 'RATE_LIMITED');
  assert.equal(err.message, 'Rate limit exceeded');
  assert.equal(err.status, 429);
  assert.equal(err.code, 'RATE_LIMITED');
  assert.equal(err.name, 'ApiError');
});

test('ApiError: defaults to API_ERROR and null status', () => {
  const err = new ApiError('Unexpected error');
  assert.equal(err.message, 'Unexpected error');
  assert.equal(err.status, null);
  assert.equal(err.code, 'API_ERROR');
});

test('apiClient: checkText calls correct endpoint and headers', async () => {
  const originalFetch = globalThis.fetch;
  try {
    let capturedUrl = null;
    let capturedOptions = null;

    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;
      return {
        ok: true,
        json: async () => ({ risk_level: 'HIGH', risk_score: 95 })
      };
    };

    const res = await apiClient.checkText({ text: 'Share OTP urgently', language: 'en' });
    assert.equal(capturedUrl, 'http://localhost:8000/api/check/text');
    assert.equal(capturedOptions.method, 'POST');
    assert.equal(capturedOptions.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(capturedOptions.body), { text: 'Share OTP urgently', language: 'en' });
    assert.equal(res.risk_level, 'HIGH');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('apiClient: checkGuided calls /check/guided', async () => {
  const originalFetch = globalThis.fetch;
  try {
    let capturedUrl = null;
    globalThis.fetch = async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        json: async () => ({ risk_level: 'MEDIUM', risk_score: 60 })
      };
    };

    const res = await apiClient.checkGuided({ contact_source: 'sms', language: 'en' });
    assert.equal(capturedUrl, 'http://localhost:8000/api/check/guided');
    assert.equal(res.risk_score, 60);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('apiClient: checkUrl calls /check/url', async () => {
  const originalFetch = globalThis.fetch;
  try {
    let capturedUrl = null;
    globalThis.fetch = async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        json: async () => ({ risk_level: 'HIGH', domain: 'fake-kyc.com' })
      };
    };

    const res = await apiClient.checkUrl({ url: 'http://fake-kyc.com' });
    assert.equal(capturedUrl, 'http://localhost:8000/api/check/url');
    assert.equal(res.domain, 'fake-kyc.com');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('apiClient: checkQr calls /check/qr', async () => {
  const originalFetch = globalThis.fetch;
  try {
    let capturedUrl = null;
    globalThis.fetch = async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        json: async () => ({ risk_level: 'HIGH', payload_type: 'upi' })
      };
    };

    const res = await apiClient.checkQr({ payload: 'upi://pay?pa=test@upi' });
    assert.equal(capturedUrl, 'http://localhost:8000/api/check/qr');
    assert.equal(res.payload_type, 'upi');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('apiClient: submitFeedback calls /feedback', async () => {
  const originalFetch = globalThis.fetch;
  try {
    let capturedUrl = null;
    globalThis.fetch = async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        json: async () => ({ status: 'success', feedback_id: 'fb_123' })
      };
    };

    const res = await apiClient.submitFeedback({ feedback_rating: 'helpful' });
    assert.equal(capturedUrl, 'http://localhost:8000/api/feedback');
    assert.equal(res.status, 'success');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('apiClient: handles 429 Rate Limit error gracefully', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: async () => ({ detail: 'Rate limit exceeded: 120 per 1 minute' })
    });

    await assert.rejects(
      async () => {
        await apiClient.checkText({ text: 'Hello' });
      },
      (err) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 429);
        assert.equal(err.code, 'RATE_LIMITED');
        assert(err.message.includes('Too many requests'));
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('apiClient: handles 500 Server Error gracefully', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ detail: 'Internal failure' })
    });

    await assert.rejects(
      async () => {
        await apiClient.checkText({ text: 'Hello' });
      },
      (err) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 500);
        assert.equal(err.code, 'SERVER_ERROR');
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('apiClient: handles network connection failure gracefully', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      throw new TypeError('Failed to fetch');
    };

    await assert.rejects(
      async () => {
        await apiClient.checkText({ text: 'Hello' });
      },
      (err) => {
        assert(err instanceof ApiError);
        assert.equal(err.code, 'NETWORK_ERROR');
        assert(err.message.includes('Ensure the local backend server is running'));
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('apiClient: analyzeMessage calls /analyze endpoint', async () => {
  const originalFetch = globalThis.fetch;
  try {
    let capturedUrl = null;
    globalThis.fetch = async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        json: async () => ({ risk_level: 'HIGH', status: 'flagged', detected_urls: ['http://bad.top'] })
      };
    };

    const res = await apiClient.analyzeMessage({ message: 'Pay now http://bad.top' });
    assert.equal(capturedUrl, 'http://localhost:8000/api/analyze');
    assert.equal(res.status, 'flagged');
    assert.equal(res.detected_urls.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('apiClient: analyzeUrl calls /analyze-url and preserves unverified status', async () => {
  const originalFetch = globalThis.fetch;
  try {
    let capturedUrl = null;
    globalThis.fetch = async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        json: async () => ({
          risk_level: 'UNABLE_TO_ASSESS',
          status: 'unverified',
          domain: 'fake-bank-verify.example',
          why_suspicious: ['Synthetic test domain cannot be verified as safe.']
        })
      };
    };

    const res = await apiClient.analyzeUrl({ url: 'https://fake-bank-verify.example/confirm' });
    assert.equal(capturedUrl, 'http://localhost:8000/api/analyze-url');
    assert.equal(res.status, 'unverified');
    assert.equal(res.risk_level, 'UNABLE_TO_ASSESS');
    assert.notEqual(res.status, 'pass');
    assert.notEqual(res.risk_level, 'LOW');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('apiClient: checkLink calls /check-link with typed options', async () => {
  const originalFetch = globalThis.fetch;
  try {
    let capturedUrl = null;
    let capturedBody = null;
    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          status: 'unverified',
          summary: "We couldn't verify this link. That doesn't mean it is safe.",
          normalized_url: 'https://unverified-sample.org',
          checks: { syntax: 'passed', host_analysis: 'completed', reputation: 'unavailable' },
          findings: [],
          recommendations: ['Verify independently before entering details.']
        })
      };
    };

    const res = await apiClient.checkLink({ url: 'https://unverified-sample.org', include_reputation: true });
    assert.equal(capturedUrl, 'http://localhost:8000/api/check-link');
    assert.equal(capturedBody.url, 'https://unverified-sample.org');
    assert.equal(capturedBody.include_reputation, true);
    assert.equal(res.status, 'unverified');
    assert.equal(res.checks.syntax, 'passed');
    assert.notEqual(res.status, 'safe');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('apiClient: fetchDirectory calls /directory endpoint', async () => {
  const originalFetch = globalThis.fetch;
  try {
    let capturedUrl = null;
    globalThis.fetch = async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        json: async () => ({
          status: 'success',
          gateways: [{ domain: 'stripe.com', name: 'Stripe', category: 'payment_gateway' }],
          subscriptions: [{ domain: 'netflix.com', name: 'Netflix', category: 'subscription_platform' }],
          banks: [{ domain: 'hdfcbank.com', name: 'HDFC Bank', category: 'bank' }]
        })
      };
    };

    const res = await apiClient.fetchDirectory();
    assert.equal(capturedUrl, 'http://localhost:8000/api/directory');
    assert.equal(res.status, 'success');
    assert.equal(res.gateways.length, 1);
    assert.equal(res.subscriptions.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('apiClient: analyzeSubscription calls /subscriptions/analyze endpoint', async () => {
  const originalFetch = globalThis.fetch;
  try {
    let capturedUrl = null;
    let capturedBody = null;
    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          threat_level: 'scam_impersonation',
          confidence: 'HIGH',
          platform_identified: 'Geek Squad',
          summary: 'Detected fake Geek Squad invoice scam.',
          warning_signals: ['Fake call center helpline'],
          actionable_steps: ['Never call the phone number in the message.']
        })
      };
    };

    const res = await apiClient.analyzeSubscription({ text: 'Geek squad renewal $499' });
    assert.equal(capturedUrl, 'http://localhost:8000/api/subscriptions/analyze');
    assert.equal(capturedBody.text, 'Geek squad renewal $499');
    assert.equal(res.threat_level, 'scam_impersonation');
    assert.equal(res.platform_identified, 'Geek Squad');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

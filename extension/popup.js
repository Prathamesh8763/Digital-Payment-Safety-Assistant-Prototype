const API_BASE = 'http://localhost:8000/api';

const EXCLUDED_FINANCIAL_PATTERNS = [
  'billdesk', 'razorpay', 'payu.in', 'cashfree', 'ccavenue',
  'netbanking', 'retail.onlinesbi', 'hdfcbank.com', 'icicibank.com', 'axisbank.com'
];

document.addEventListener('DOMContentLoaded', () => {
  const tabText = document.getElementById('tab-text');
  const tabUrl = document.getElementById('tab-url');
  const panelText = document.getElementById('panel-text');
  const panelUrl = document.getElementById('panel-url');
  
  const textInput = document.getElementById('text-input');
  const urlInput = document.getElementById('url-input');
  
  const btnCheckText = document.getElementById('btn-check-text');
  const btnCheckUrl = document.getElementById('btn-check-url');
  const btnImportSelection = document.getElementById('btn-import-selection');
  
  const errorContainer = document.getElementById('error-container');
  const resultContainer = document.getElementById('result-container');

  // Tab switching
  tabText.addEventListener('click', () => {
    tabText.classList.add('active');
    tabUrl.classList.remove('active');
    panelText.style.display = 'block';
    panelUrl.style.display = 'none';
    clearError();
  });

  tabUrl.addEventListener('click', () => {
    tabUrl.classList.add('active');
    tabText.classList.remove('active');
    panelUrl.style.display = 'block';
    panelText.style.display = 'none';
    clearError();
  });

  function showError(msg) {
    errorContainer.textContent = msg;
    errorContainer.style.display = 'block';
  }

  function clearError() {
    errorContainer.textContent = '';
    errorContainer.style.display = 'none';
  }

  // Explicit Selection Grabber from active tab
  btnImportSelection.addEventListener('click', async () => {
    clearError();
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        showError('No active browser tab found.');
        return;
      }

      // FR-08 Policy: Exclude financial checkout / netbanking pages
      const tabUrlLower = (tab.url || '').toLowerCase();
      const isExcluded = EXCLUDED_FINANCIAL_PATTERNS.some(p => tabUrlLower.includes(p));
      if (isExcluded) {
        showError('🔒 Security Policy: Extension content capture is disabled on active banking and payment gateway pages for your privacy.');
        return;
      }

      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection().toString()
      });

      if (result && result.trim()) {
        textInput.value = result.trim();
      } else {
        showError('No text was highlighted on the current webpage. Highlight text first or type/paste it manually.');
      }
    } catch (err) {
      showError('Could not read selection from this page (internal browser page or restricted domain).');
    }
  });

  // Check text safety
  btnCheckText.addEventListener('click', async () => {
    clearError();
    const text = textInput.value.trim();
    if (!text || text.length < 3) {
      showError('Please enter at least 3 characters.');
      return;
    }

    btnCheckText.disabled = true;
    btnCheckText.textContent = 'Analyzing...';

    try {
      const response = await fetch(`${API_BASE}/check/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Server error while analyzing text.');
      }

      const data = await response.json();
      renderResult(data);
    } catch (err) {
      showError('Failed to connect to Safety Assistant server at localhost:8000. Ensure backend is running.');
    } finally {
      btnCheckText.disabled = false;
      btnCheckText.textContent = 'Check Safety';
    }
  });

  // Check URL safety
  btnCheckUrl.addEventListener('click', async () => {
    clearError();
    const url = urlInput.value.trim();
    if (!url || url.length < 3) {
      showError('Please enter a valid link or web address.');
      return;
    }

    btnCheckUrl.disabled = true;
    btnCheckUrl.textContent = 'Inspecting...';

    try {
      const response = await fetch(`${API_BASE}/check/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error('Server error while inspecting link.');
      }

      const data = await response.json();
      renderResult(data);
    } catch (err) {
      showError('Failed to connect to Safety Assistant server at localhost:8000.');
    } finally {
      btnCheckUrl.disabled = false;
      btnCheckUrl.textContent = 'Inspect Link Safely';
    }
  });

  function renderResult(data) {
    resultContainer.className = `result-box ${data.risk_level}`;
    resultContainer.style.display = 'block';

    const reasonsHtml = (data.why_suspicious || [])
      .map(r => `<li>${r}</li>`)
      .join('');

    const actionsHtml = (data.recommended_actions || [])
      .map(a => `<li>${a}</li>`)
      .join('');

    resultContainer.innerHTML = `
      <div class="result-title">
        ${data.risk_level === 'HIGH' ? '⚠️ HIGH RISK DETECTED' : (data.risk_level === 'MEDIUM' ? '⚡ MEDIUM RISK' : '✓ LOW RISK')} (${data.risk_score}/100)
      </div>
      <div style="font-size: 11.5px; margin-bottom: 6px;">${data.summary}</div>
      
      ${reasonsHtml ? `<strong>Warning Signs:</strong><ul class="reasons-list">${reasonsHtml}</ul>` : ''}
      ${actionsHtml ? `<strong>Action to Take:</strong><ul class="reasons-list">${actionsHtml}</ul>` : ''}

      ${data.educational_concept ? `
        <div class="golden-rule">
          💡 ${data.educational_concept.golden_rule}
        </div>
      ` : ''}
    `;
  }
});

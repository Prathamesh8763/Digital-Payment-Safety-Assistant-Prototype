import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Register PWA Service Worker for app shell (bypasses all dynamic safety APIs)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch(() => {
        // Silent fallback: app runs normally without service worker
      });
  });
}

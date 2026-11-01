import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

describe('Mobile-First Responsive Web Optimization Tests', () => {

  test('Design Tokens: includes mobile breakpoints, safe area insets, and 44px touch target', () => {
    const tokensPath = path.join(ROOT, 'src/styles/tokens.css');
    assert.ok(fs.existsSync(tokensPath), 'tokens.css must exist');
    const css = fs.readFileSync(tokensPath, 'utf8');

    assert.ok(css.includes('--bp-xs: 320px'), 'tokens.css must define 320px extra small mobile breakpoint');
    assert.ok(css.includes('--bp-sm: 375px'), 'tokens.css must define 375px standard mobile breakpoint');
    assert.ok(css.includes('--bp-md: 768px'), 'tokens.css must define 768px tablet breakpoint');
    assert.ok(css.includes('--min-touch-target: 44px'), 'tokens.css must define WCAG compliant 44px minimum touch target');
    assert.ok(css.includes('--safe-area-top'), 'tokens.css must support safe area insets for notched devices');
  });

  test('Global Mobile Base: prevents iOS Safari auto-zoom with 16px input rule and disables horizontal overflow', () => {
    const indexPath = path.join(ROOT, 'src/index.css');
    assert.ok(fs.existsSync(indexPath), 'index.css must exist');
    const css = fs.readFileSync(indexPath, 'utf8');

    assert.ok(css.includes('overflow-x: hidden'), 'index.css must prevent horizontal overflow on viewport');
    assert.ok(css.includes('touch-action: manipulation'), 'index.css must eliminate 300ms mobile tap delay');
    assert.ok(
      css.includes('font-size: 16px !important') && css.includes('max-width: 767px'),
      'index.css must set font-size >= 16px on inputs on mobile to prevent iOS Safari auto-zoom'
    );
    assert.ok(css.includes('.table-responsive'), 'index.css must provide .table-responsive wrapper utility');
    assert.ok(css.includes('-webkit-overflow-scrolling: touch'), 'table-responsive must use smooth touch scrolling');
  });

  test('HTML Viewport: includes viewport-fit=cover for edge-to-edge mobile screens', () => {
    const htmlPath = path.join(ROOT, 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(html.includes('viewport-fit=cover'), 'index.html must include viewport-fit=cover in viewport meta tag');
  });

  test('PWA Manifest: contains standalone display, portrait orientation, and responsive icons', () => {
    const manifestPath = path.join(ROOT, 'public/manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    assert.strictEqual(manifest.display, 'standalone', 'PWA display must be standalone');
    assert.strictEqual(manifest.orientation, 'portrait-primary', 'PWA orientation must be portrait-primary');
    assert.ok(manifest.icons.some(i => i.sizes === '192x192'), 'Must include 192x192 icon');
    assert.ok(manifest.icons.some(i => i.sizes === '512x512'), 'Must include 512x512 icon');
  });

  test('Service Worker Security: strictly bypasses cache for dynamic APIs and never caches user inputs', () => {
    const swPath = path.join(ROOT, 'public/sw.js');
    assert.ok(fs.existsSync(swPath), 'sw.js must exist');
    const swContent = fs.readFileSync(swPath, 'utf8');

    // Strict security assertions
    assert.ok(swContent.includes("request.method !== 'GET'"), 'SW must reject all non-GET requests from caching');
    assert.ok(swContent.includes('/api'), 'SW must bypass caching for /api endpoints');
    assert.ok(swContent.includes('/check'), 'SW must bypass caching for /check endpoints');
    assert.ok(swContent.includes('/analyze'), 'SW must bypass caching for /analyze endpoints');
    assert.ok(swContent.includes('clearpay-app-shell'), 'SW must use dedicated app-shell cache');
  });

  test('CheckLinkPage Table: checks table is safely wrapped in .table-responsive', () => {
    const pagePath = path.join(ROOT, 'src/components/CheckLinkPage.jsx');
    const content = fs.readFileSync(pagePath, 'utf8');
    assert.ok(
      content.includes('<div className="table-responsive">') &&
      content.includes('<table className="checklink-checks-table">'),
      'CheckLinkPage must wrap checks table in .table-responsive'
    );
    assert.ok(content.includes('type="url"'), 'URL input must use type="url" for mobile keyboards');
    assert.ok(content.includes('inputMode="url"'), 'URL input must use inputMode="url" for mobile keyboards');
  });

  test('Subpage Headers: responsive rules hide verbose desktop links on screens < 768px', () => {
    const analyzeCss = fs.readFileSync(path.join(ROOT, 'src/styles/analyze.css'), 'utf8');
    assert.ok(analyzeCss.includes('.v6-nav-link') && analyzeCss.includes('display: none !important'), 'analyze.css must hide desktop links on mobile');

    const checkLinkCss = fs.readFileSync(path.join(ROOT, 'src/styles/checkLink.css'), 'utf8');
    assert.ok(checkLinkCss.includes('.checklink-nav-links') && checkLinkCss.includes('display: none !important'), 'checkLink.css must hide desktop links on mobile');

    const reportGuideCss = fs.readFileSync(path.join(ROOT, 'src/styles/reportGuide.css'), 'utf8');
    assert.ok(reportGuideCss.includes('@media (max-width: 768px)'), 'reportGuide.css must include mobile media queries');

    const scamGuideCss = fs.readFileSync(path.join(ROOT, 'src/styles/scamGuide.css'), 'utf8');
    assert.ok(scamGuideCss.includes('@media (max-width: 768px)'), 'scamGuide.css must include mobile media queries');

    const subSafetyCss = fs.readFileSync(path.join(ROOT, 'src/styles/subscriptionSafety.css'), 'utf8');
    assert.ok(subSafetyCss.includes('@media (max-width: 768px)'), 'subscriptionSafety.css must include mobile media queries');
  });

});

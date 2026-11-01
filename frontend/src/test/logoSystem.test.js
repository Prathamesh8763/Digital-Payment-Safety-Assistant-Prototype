import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '../../');
const publicDir = path.resolve(frontendDir, 'public');
const assetsDir = path.resolve(frontendDir, 'src/assets');

test('Logo System: 4 required logo files exist in public and assets directories', () => {
  const publicFiles = ['favicon.svg', 'logo-symbol.svg', 'logo-horizontal.svg', 'logo-full.svg'];
  for (const file of publicFiles) {
    const fullPath = path.join(publicDir, file);
    assert.ok(fs.existsSync(fullPath), `Expected ${file} to exist in public/`);
    const content = fs.readFileSync(fullPath, 'utf8');
    assert.ok(content.length > 50, `${file} should not be empty`);
    assert.ok(content.includes('<svg'), `${file} should be valid SVG`);
  }

  const assetFiles = ['logo-symbol.svg', 'logo-horizontal.svg', 'logo-full.svg'];
  for (const file of assetFiles) {
    const fullPath = path.join(assetsDir, file);
    assert.ok(fs.existsSync(fullPath), `Expected ${file} to exist in src/assets/`);
  }
});

test('Logo System: Shield emblem contains navy blue and emerald green security identity', () => {
  const symbolSvg = fs.readFileSync(path.join(publicDir, 'logo-symbol.svg'), 'utf8');
  assert.ok(symbolSvg.includes('#1e3a8a') || symbolSvg.includes('#0f172a'), 'Should contain navy blue');
  assert.ok(symbolSvg.includes('#10b981') || symbolSvg.includes('#34d399'), 'Should contain security emerald green');
  assert.ok(symbolSvg.includes('viewBox="0 0 40 40"'), 'Should define viewBox');
});

test('Logo System: Horizontal logo contains ClearPay wordmark and payment safety tagline', () => {
  const horizontalSvg = fs.readFileSync(path.join(publicDir, 'logo-horizontal.svg'), 'utf8');
  assert.ok(horizontalSvg.includes('Clear'), 'Should include Clear');
  assert.ok(horizontalSvg.includes('Pay'), 'Should include Pay');
  assert.ok(horizontalSvg.includes('PAYMENT SAFETY ASSISTANT'), 'Should include official tagline');
});

test('Logo System: Full brand logo contains stacked emblem and digital payment safety assistant pill', () => {
  const fullSvg = fs.readFileSync(path.join(publicDir, 'logo-full.svg'), 'utf8');
  assert.ok(fullSvg.includes('Clear'), 'Should include Clear');
  assert.ok(fullSvg.includes('Pay'), 'Should include Pay');
  assert.ok(fullSvg.includes('DIGITAL PAYMENT SAFETY ASSISTANT'), 'Should include full tagline');
});

test('Logo System: PWA manifest is valid JSON and links to brand icons', () => {
  const manifestPath = path.join(publicDir, 'manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'manifest.json should exist');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.short_name, 'ClearPay');
  assert.ok(manifest.name.includes('ClearPay'));
  assert.ok(manifest.icons.some((i) => i.src === '/favicon.svg'));
  assert.ok(manifest.icons.some((i) => i.src === '/logo-symbol.svg'));
});

test('Logo System: index.html contains tab title, favicon, manifest, and Open Graph tags', () => {
  const indexPath = path.join(frontendDir, 'index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  assert.ok(indexHtml.includes('ClearPay – Digital Payment Safety Assistant'), 'Title should reflect ClearPay');
  assert.ok(indexHtml.includes('/favicon.svg'), 'Favicon should link to /favicon.svg');
  assert.ok(indexHtml.includes('/manifest.json'), 'Should link to /manifest.json');
  assert.ok(indexHtml.includes('property="og:title"'), 'Should define og:title');
  assert.ok(indexHtml.includes('property="og:image"'), 'Should define og:image');
});

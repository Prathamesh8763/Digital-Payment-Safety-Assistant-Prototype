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

test('Logo System: PNG variations and icons exist in public and assets directories', () => {
  const publicPngs = [
    'logo-original.png',
    'logo-full.png',
    'logo-symbol.png',
    'logo-horizontal.png',
    'favicon.png',
    'icon-192.png',
    'icon-512.png'
  ];
  for (const file of publicPngs) {
    const fullPath = path.join(publicDir, file);
    assert.ok(fs.existsSync(fullPath), `Expected ${file} to exist in public/`);
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size > 100, `${file} should not be empty`);
  }

  const assetPngs = ['logo-original.png', 'logo-full.png', 'logo-symbol.png', 'logo-horizontal.png'];
  for (const file of assetPngs) {
    const fullPath = path.join(assetsDir, file);
    assert.ok(fs.existsSync(fullPath), `Expected ${file} to exist in src/assets/`);
  }
});

test('Logo System: 4 required SVG logo files exist and are valid SVGs', () => {
  const svgFiles = ['favicon.svg', 'logo-symbol.svg', 'logo-horizontal.svg', 'logo-full.svg'];
  for (const file of svgFiles) {
    const fullPath = path.join(publicDir, file);
    assert.ok(fs.existsSync(fullPath), `Expected ${file} to exist in public/`);
    const content = fs.readFileSync(fullPath, 'utf8');
    assert.ok(content.length > 50, `${file} should not be empty`);
    assert.ok(content.includes('<svg'), `${file} should be valid SVG`);
    assert.ok(content.includes('</svg>'), `${file} should close svg tag`);
  }
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

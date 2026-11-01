import test from 'node:test';
import assert from 'node:assert/strict';
import i18n from '../i18n/index.js';
import en from '../i18n/locales/en.js';
import hi from '../i18n/locales/hi.js';
import hinglish from '../i18n/locales/hinglish.js';
import { translateIndicator, translateAction, getBannerCopy } from '../utils/resultFormatters.js';

test('i18n: initializes with valid language resources', () => {
  assert.ok(i18n.hasResourceBundle('en', 'translation'));
  assert.ok(i18n.hasResourceBundle('hi', 'translation'));
  assert.ok(i18n.hasResourceBundle('hinglish', 'translation'));
});

test('Multilingual Table: core UI navigation matches user specifications', async () => {
  // English
  await i18n.changeLanguage('en');
  assert.equal(i18n.t('common.nav_how_it_works'), 'How it works');
  assert.equal(i18n.t('common.nav_back_home'), 'Back to home');
  assert.equal(i18n.t('analyzer.title_message'), 'Check a message before you act.');
  assert.equal(i18n.t('analyzer.tab_message'), 'Message');
  assert.equal(i18n.t('analyzer.tab_history'), 'History');
  assert.equal(i18n.t('common.nav_privacy'), 'Privacy');

  // Hindi
  await i18n.changeLanguage('hi');
  assert.equal(i18n.t('common.nav_how_it_works'), 'यह कैसे काम करता है');
  assert.equal(i18n.t('common.nav_back_home'), 'होम पर वापस जाएं');
  assert.equal(i18n.t('analyzer.title_message'), 'कोई भी कदम उठाने से पहले मैसेज जांचें।');
  assert.equal(i18n.t('analyzer.tab_message'), 'संदेश');
  assert.equal(i18n.t('analyzer.tab_history'), 'इतिहास');
  assert.equal(i18n.t('common.nav_privacy'), 'गोपनीयता');

  // Hinglish
  await i18n.changeLanguage('hinglish');
  assert.equal(i18n.t('common.nav_how_it_works'), 'Kaise kaam karta hai');
  assert.equal(i18n.t('common.nav_back_home'), 'Home par wapas jaayein');
  assert.equal(i18n.t('analyzer.title_message'), 'Koi bhi action lene se pehle message check karein.');
  assert.equal(i18n.t('analyzer.tab_message'), 'Message');
  assert.equal(i18n.t('analyzer.tab_history'), 'History');
  assert.equal(i18n.t('common.nav_privacy'), 'Privacy');
});

test('Reason Code Translation: translates backend indicators dynamically', async () => {
  const backendIndicator = {
    id: 'sensitive_credential_request',
    name: 'Sensitive Credential Request',
    description: 'Requests OTP, UPI PIN, or password.',
    severity: 'high'
  };

  // English
  await i18n.changeLanguage('en');
  const enTranslated = translateIndicator(backendIndicator, i18n.t);
  assert.equal(enTranslated.title, 'Sensitive Credential Request');

  // Hindi
  await i18n.changeLanguage('hi');
  const hiTranslated = translateIndicator(backendIndicator, i18n.t);
  assert.equal(hiTranslated.title, 'संवेदनशील क्रेडेंशियल की मांग');
  assert.ok(hiTranslated.description.includes('ओटीपी, यूपीआई पिन'));

  // Hinglish
  await i18n.changeLanguage('hinglish');
  const hinglishTranslated = translateIndicator(backendIndicator, i18n.t);
  assert.equal(hinglishTranslated.title, 'Sensitive Credential Request');
  assert.ok(hinglishTranslated.description.includes('OTP, UPI PIN'));
});

test('Action Translation: translates security recommendations across languages', async () => {
  const rawAction = 'Never share your OTP or UPI PIN with anyone';

  await i18n.changeLanguage('en');
  assert.ok(translateAction(rawAction, i18n.t).includes('Never share your OTP'));

  await i18n.changeLanguage('hi');
  assert.ok(translateAction(rawAction, i18n.t).includes('अपना ओटीपी, यूपीआई पिन'));

  await i18n.changeLanguage('hinglish');
  assert.ok(translateAction(rawAction, i18n.t).includes('Apna OTP, UPI PIN'));
});

test('Banner Copy: risk assessment banner adapts to selected language', async () => {
  await i18n.changeLanguage('hi');
  const hiBanner = getBannerCopy('high', 'flagged', i18n.t);
  assert.equal(hiBanner.tag, 'उच्च जोखिम • संभावित खतरा');
  assert.equal(hiBanner.headline, 'आगे न बढ़ें — संभावित पेमेंट धोखाधड़ी पकड़ी गई।');

  await i18n.changeLanguage('hinglish');
  const hinglishBanner = getBannerCopy('high', 'flagged', i18n.t);
  assert.equal(hinglishBanner.tag, 'HIGH RISK • POTENTIAL THREAT');
  assert.equal(hinglishBanner.headline, 'Aage na badhein — potential payment manipulation detect hui hai.');
});

test('Dictionary Parity: all key paths in en exist in hi and hinglish', () => {
  function getKeys(obj, prefix = '') {
    return Object.keys(obj).reduce((res, el) => {
      if (Array.isArray(obj[el])) {
        return res;
      } else if (typeof obj[el] === 'object' && obj[el] !== null) {
        return [...res, ...getKeys(obj[el], prefix + el + '.')];
      }
      return [...res, prefix + el];
    }, []);
  }

  const enKeys = getKeys(en);
  const hiKeys = new Set(getKeys(hi));
  const hinglishKeys = new Set(getKeys(hinglish));

  const missingInHi = enKeys.filter(k => !hiKeys.has(k));
  const missingInHinglish = enKeys.filter(k => !hinglishKeys.has(k));

  assert.deepEqual(missingInHi, [], `Missing translation keys in hi.json: ${missingInHi.join(', ')}`);
  assert.deepEqual(missingInHinglish, [], `Missing translation keys in hinglish.json: ${missingInHinglish.join(', ')}`);
});

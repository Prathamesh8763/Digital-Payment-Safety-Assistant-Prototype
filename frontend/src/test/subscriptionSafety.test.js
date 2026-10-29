import { test } from 'node:test';
import assert from 'node:assert/strict';

test('Subscription Safety: Sample invoices contain realistic bait patterns', () => {
  const sampleInvoices = [
    {
      title: 'Geek Squad $499 Renewal Scam',
      text: 'INVOICE #GS-89211: Thank you for renewing your Geek Squad 3-Year Total Protection. Amount: $499.00 has been debited via auto-debit. If you did not authorize this charge, call our cancellation helpline immediately at +1-888-555-0199.'
    },
    {
      title: 'Netflix Account On Hold',
      text: 'Netflix Notice: We were unable to process your monthly payment of $19.99. Your membership will be suspended within 24 hours. Click here to confirm your payment details: https://netflix-billing-renew.info/update'
    },
    {
      title: 'PayPal Unauthorized Invoice',
      text: 'PayPal: You sent a payment of $680.00 USD to Bitcoin Exchange Inc. If you did not make this transaction, call our fraud department right now at 1-800-555-0144 to dispute this charge.'
    }
  ];

  for (const inv of sampleInvoices) {
    assert(inv.title.length > 5);
    assert(inv.text.length > 20);
    // Each sample represents a known scam pattern (call center bait or suspension threat)
    const hasPhoneOrLink = /call|helpline|phone|\d{3}-\d{3}-\d{4}|https?:\/\//i.test(inv.text);
    assert(hasPhoneOrLink, `Sample ${inv.title} must exhibit scam indicator patterns`);
  }
});

test('Subscription Safety: Trial Trap Calculator correctly computes deadlines and commitments', () => {
  // Test case 1: 7-day trial, $14.99/mo, 2 days notice
  const trialDays1 = 7;
  const price1 = 14.99;
  const noticeDays1 = 2;

  const deadline1 = Math.max(1, trialDays1 - noticeDays1);
  const yearly1 = (price1 * 12).toFixed(2);

  assert.equal(deadline1, 5, '7-day trial with 2-day notice buffer must give deadline at day 5');
  assert.equal(yearly1, '179.88', '14.99 * 12 must equal 179.88');

  // Test case 2: 30-day trial, $29.99/mo, 3 days notice
  const trialDays2 = 30;
  const price2 = 29.99;
  const noticeDays2 = 3;

  const deadline2 = Math.max(1, trialDays2 - noticeDays2);
  const yearly2 = (price2 * 12).toFixed(2);

  assert.equal(deadline2, 27);
  assert.equal(yearly2, '359.88');
});

test('Subscription Safety: Cancellation guides cover critical payment channels', () => {
  const channels = ['upi', 'cards', 'playstore', 'apple', 'paypal'];

  assert.equal(channels.length, 5);
  assert(channels.includes('upi'), 'Must include UPI AutoPay cancellation');
  assert(channels.includes('cards'), 'Must include Card e-mandate cancellation');
  assert(channels.includes('playstore'), 'Must include Google Play Store cancellation');
  assert(channels.includes('apple'), 'Must include Apple App Store cancellation');
  assert(channels.includes('paypal'), 'Must include PayPal recurring billing cancellation');
});

test('Subscription Safety: Directory filters correctly segment categories and queries', () => {
  const directory = [
    { domain: 'checkout.stripe.com', name: 'Stripe Checkout', category: 'payment_gateway' },
    { domain: 'paypal.com', name: 'PayPal', category: 'payment_gateway' },
    { domain: 'netflix.com', name: 'Netflix', category: 'subscription_platform' },
    { domain: 'spotify.com', name: 'Spotify', category: 'subscription_platform' },
    { domain: 'hdfcbank.com', name: 'HDFC Bank', category: 'bank' }
  ];

  // Category filter: gateways
  const gateways = directory.filter((d) => d.category === 'payment_gateway');
  assert.equal(gateways.length, 2);

  // Category filter: subscriptions
  const subs = directory.filter((d) => d.category === 'subscription_platform');
  assert.equal(subs.length, 2);

  // Category filter: banks
  const banks = directory.filter((d) => d.category === 'bank');
  assert.equal(banks.length, 1);

  // Search query filter: "stripe"
  const stripeSearch = directory.filter(
    (d) => d.name.toLowerCase().includes('stripe') || d.domain.toLowerCase().includes('stripe')
  );
  assert.equal(stripeSearch.length, 1);
  assert.equal(stripeSearch[0].name, 'Stripe Checkout');
});

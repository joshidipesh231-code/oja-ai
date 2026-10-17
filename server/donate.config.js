// ============================================================================
// DONATION METHODS — where Dipesh adds his real payment details later.
// ============================================================================
//
// Each entry:
//   id      — stable key used by the frontend ('esewa', 'khalti', 'paypal',
//             'upi', 'card', 'bank')
//   label   — display name shown in the donate panel
//   note    — short helper text shown under the label
//   details — null for now. Later, put real account info here, e.g.:
//
//       details: {
//         accountId: '98XXXXXXXX',          // eSewa/Khalti ID or UPI VPA
//         accountName: 'Dipesh Joshi',
//         qrImageUrl: '/uploads/donate/esewa-qr.png',  // image served by /api/media or /uploads
//         link: 'https://paypal.me/yourname',          // PayPal.me / payment link
//       }
//
// Do NOT commit real account numbers, VPA IDs, or personal payment links to a
// public repo — keep them in this file only on private deployments, or load
// them from environment variables.
//
// There is deliberately NO charging logic here: this endpoint only exposes
// the display config above. No fake links, no placeholder URLs.
// ============================================================================

export const DONATION_METHODS = [
  {
    id: 'esewa',
    label: 'eSewa',
    note: 'Add your eSewa ID / QR in server/donate.config.js',
    details: null,
  },
  {
    id: 'khalti',
    label: 'Khalti',
    note: 'Add your Khalti ID / QR in server/donate.config.js',
    details: null,
  },
  {
    id: 'paypal',
    label: 'PayPal',
    note: 'Add your PayPal link in server/donate.config.js',
    details: null,
  },
  {
    id: 'upi',
    label: 'UPI',
    note: 'Add your UPI ID in server/donate.config.js',
    details: null,
  },
  {
    id: 'card',
    label: 'Card',
    note: 'Add card payment details in server/donate.config.js',
    details: null,
  },
  {
    id: 'bank',
    label: 'Bank transfer',
    note: 'Add bank account details in server/donate.config.js',
    details: null,
  },
];

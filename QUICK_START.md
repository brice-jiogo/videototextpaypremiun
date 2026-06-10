# Quick Start Guide 🚀

Get up and running in 5 minutes!

## 1️⃣ Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/premium-subscription-platform.git
cd premium-subscription-platform

# Install dependencies
npm install
```

## 2️⃣ Configuration

### Copy Environment File
```bash
cp .env.example .env
```

### Get Firebase Credentials
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use existing one
3. Get your Project ID from project settings
4. Create a service account and download JSON
5. Encode it: `cat firebase-key.json | base64`
6. Paste into `FIREBASE_SERVICE_ACCOUNT_JSON_BASE64` in `.env`

### Get Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Enable API in test mode
3. Copy Secret Key (starts with `sk_test_`)
4. Paste into `STRIPE_SECRET_KEY` in `.env`

### Optional: Email Receipts
1. Enable 2FA on your Gmail account
2. Generate [App Password](https://support.google.com/accounts/answer/185833)
3. Use app password in `SMTP_PASSWORD`

## 3️⃣ Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 4️⃣ Test a Subscription

### Using Stripe Test Card
- **Card Number**: 4242 4242 4242 4242
- **Expiry**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **Name**: Any name

### Create Test Account
1. Click "Start Free Trial"
2. Sign up with any email
3. Complete Stripe checkout with test card
4. Done! ✅

## 5️⃣ Build for Production

```bash
npm run build
```

This creates:
- `dist/` - Frontend build
- `dist/server.cjs` - Production backend (43.9 KB)

## 📚 Next Steps

- Read [README.md](README.md) for full documentation
- Check [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines
- Review [SECURITY.md](SECURITY.md) for security best practices

## 🐛 Troubleshooting

### "FIREBASE_PROJECT_ID is not configured"
→ Check your `.env` file has the correct Firebase credentials

### "STRIPE_SECRET_KEY is not configured"
→ Make sure you're using the Secret Key, not Publishable Key (starts with `sk_`, not `pk_`)

### "Email not sending"
→ SMTP is optional. Email receipts only work if configured. Check Stripe sends receipts by default.

### Build fails
→ Run `npm run lint` to check for TypeScript errors
→ Delete `node_modules` and `.env` files, then `npm install` again

## 💬 Need Help?

- 📖 Check [README.md](README.md) FAQ section
- 🐛 [Open an issue](https://github.com/yourusername/premium-subscription-platform/issues)
- 💌 Email: support@example.com

Happy coding! 🎉

# 🚀 PREMIUM Subscription Platform

A modern React + TypeScript application with Stripe integration for managing premium subscriptions. Features include flexible pricing plans (monthly, yearly, lifetime), Firebase authentication, and real-time subscription management.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org)

## ✨ Features

- 🔐 **Authentication**: Firebase authentication with email/password and Google Sign-In
- 💳 **Stripe Integration**: Complete payment processing with Stripe
- 📊 **Flexible Pricing**: Monthly ($9.99), Yearly ($69.99), and Lifetime ($129.99) plans
- 🎯 **Dashboard**: User dashboard with subscription management
- 📧 **Email Receipts**: Automated receipt delivery via SMTP
- 🌍 **Multi-language**: Google Translate integration
- 🎨 **Modern UI**: Responsive design with Tailwind CSS and animations
- ⚡ **Optimized Build**: 43.9 KB production server bundle
- 🛡️ **Secure**: Environment-based configuration, no hardcoded secrets

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Motion animations
- **Backend**: Express.js, Node.js
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Payment**: Stripe API
- **Email**: Nodemailer (SMTP)
- **Build**: Vite + esbuild

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Firebase**: Active project with Firestore and Authentication
- **Stripe**: API keys (test/live)
- **SMTP**: Email service credentials (optional)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/premium-subscription-platform.git
cd premium-subscription-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Fill in your credentials:

```env
# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_WEB_API_KEY=your-api-key
FIREBASE_SERVICE_ACCOUNT_JSON_BASE64=your-base64-service-account

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_MONTHLY_AMOUNT=999
STRIPE_YEARLY_AMOUNT=6999
STRIPE_LIFETIME_AMOUNT=12999

# SMTP (for email receipts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_SECURE=false

# App
APP_URL=http://localhost:3000
PORT=3000
NODE_ENV=development
```

### 4. Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build

```bash
npm run build
```

Start the production server:

```bash
node dist/server.cjs
```

## 📚 Available Scripts

- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production (Vite + esbuild)
- `npm start` - Run production server
- `npm run preview` - Preview production build locally
- `npm run clean` - Remove dist folder
- `npm run lint` - TypeScript type checking

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── GoogleTranslate.tsx
│   ├── Navigation.tsx
│   ├── ProtectedRoute.tsx
│   └── Toast.tsx
├── pages/              # Page components
│   ├── Dashboard.tsx
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── Pricing.tsx
│   └── ForgotPassword.tsx
├── context/            # React Context
│   └── AuthContext.tsx
├── lib/                # Utilities
│   ├── firebase.ts
│   ├── utils.ts
│   └── emailTemplates.ts
├── App.tsx
├── main.tsx
└── index.css

server.ts              # Express backend
vite.config.ts         # Vite configuration
tsconfig.json          # TypeScript configuration
package.json           # Dependencies
```

## 🔑 Key Features Explained

### Authentication Flow
- Firebase email/password and Google Sign-In
- Protected routes using `ProtectedRoute` component
- JWT token verification on backend
- Automatic premium status detection

### Stripe Checkout
- Client-reference pricing from Stripe configuration
- 7-day free trial for all new subscriptions
- Automatic receipt generation on successful payment
- Subscription status tracking in Firestore

### Pricing Plans
- **Monthly**: $9.99/month (7-day free trial)
- **Yearly**: $69.99/year with 42% savings (7-day free trial)
- **Lifetime**: $129.99 one-time payment

## 📧 Email Configuration

To enable receipt emails:

1. Set up SMTP credentials in `.env`
2. Use Gmail:
   - Enable 2-factor authentication
   - Generate an [App Password](https://support.google.com/accounts/answer/185833)
   - Use the app password in `SMTP_PASSWORD`

## 🚨 Production Deployment

### Build Optimization
- Server bundle: 43.9 KB (99.67% reduction from 13.2 MB)
- Vite loaded dynamically only in development
- All dependencies excluded from server bundle

### Environment Setup
Before deploying, ensure:
- ✅ All `.env` variables are set
- ✅ Firebase project is configured
- ✅ Stripe keys are set to production
- ✅ SMTP credentials are correct
- ✅ `NODE_ENV=production`

### Verification Checklist
```bash
# Type checking
npm run lint

# Build production
npm run build

# Test production locally
NODE_ENV=production node dist/server.cjs

# Verify health endpoint
curl http://localhost:3000/api/health
```

## 🐛 Debugging

### Development
Server logs print to console:
```bash
npm run dev  # Watch for logs
```

### Production
Check environment variables:
```bash
echo $FIREBASE_PROJECT_ID
echo $STRIPE_SECRET_KEY
```

## 📖 API Endpoints

### Health Check
```
GET /api/health
```

### Checkout
```
POST /api/checkout
Body: { planId, email }
```

### Premium Status
```
GET /api/premium-status
Headers: { Authorization: Bearer TOKEN }
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 📞 Support

For issues and questions:
- 📧 Email: support@example.com
- 🐛 GitHub Issues: [Open an issue](https://github.com/yourusername/premium-subscription-platform/issues)

## 🙏 Acknowledgments

- [Firebase](https://firebase.google.com) for authentication and database
- [Stripe](https://stripe.com) for payment processing
- [React](https://react.dev) for the UI framework
- [Tailwind CSS](https://tailwindcss.com) for styling

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-27

### Added
- Initial release of Premium Subscription Platform
- Firebase authentication with email/password and Google Sign-In
- Stripe integration for payment processing
- Three pricing tiers: Monthly ($9.99), Yearly ($69.99), Lifetime ($129.99)
- Dashboard for subscription management
- Email receipt generation via SMTP
- Multi-language support with Google Translate
- Responsive UI with Tailwind CSS and Motion animations
- Production-optimized build (43.9 KB server bundle)
- Comprehensive documentation and setup guides

### Fixed
- Critical production crash from improper Vite bundling
- Price inconsistencies between Landing and Pricing pages

### Performance
- Reduced server bundle from 13.2 MB to 43.9 KB (99.67% reduction)
- Dynamic Vite loading - only loaded in development mode
- Optimized build pipeline with esbuild

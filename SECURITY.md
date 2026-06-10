# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

**Do not** open public GitHub issues for security vulnerabilities.

Please email security@example.com with:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will:
- Acknowledge your report within 48 hours
- Provide updates every 5 days
- Work on a fix and release a patch
- Credit you in the security advisory (unless you prefer not to)

## Security Best Practices

When using this application:

1. **Never commit `.env` files** - Use `.env.example` instead
2. **Rotate API keys regularly** - Especially Stripe and Firebase keys
3. **Use environment variables** - Never hardcode secrets
4. **Enable Firebase security rules** - Restrict Firestore access
5. **Keep dependencies updated** - Run `npm audit` regularly
6. **Use HTTPS in production** - Never use HTTP for sensitive operations
7. **Validate user inputs** - Always validate on frontend and backend
8. **Monitor logs** - Check server logs for suspicious activity

## Dependencies

This project uses npm packages. To check for vulnerabilities:

```bash
npm audit
npm audit fix  # Auto-fix vulnerabilities
```

Update dependencies regularly:

```bash
npm update
```

## Deployment Security

Before deploying to production:

- [ ] All environment variables are set correctly
- [ ] Firebase security rules are configured
- [ ] Stripe keys are production keys
- [ ] HTTPS is enabled
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Authentication tokens expire appropriately
- [ ] Database backups are configured

## Third-party Services

This application uses:

- **Firebase**: Firestore database and authentication
- **Stripe**: Payment processing
- **Nodemailer**: Email delivery (SMTP)

Ensure you comply with each service's security requirements.

# Contributing to Premium Subscription Platform

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please read and adhere to our Code of Conduct in all interactions.

## How Can I Contribute?

### Reporting Bugs

Before submitting a bug report:
- Check if the issue already exists
- Provide a clear title and description
- Include steps to reproduce the issue
- Provide specific examples to demonstrate the steps
- Include screenshots if applicable
- Describe the observed behavior and what you expected to see

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, provide:
- A clear and descriptive title
- A detailed description of the suggested enhancement
- Examples of how the enhancement would be used
- Why this enhancement would be useful

### Pull Requests

Before starting work on a PR:
1. Check if there's an existing issue or discussion about your change
2. Fork the repository
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test thoroughly
6. Commit with clear messages: `git commit -am 'Add feature description'`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request with a clear description

## Development Setup

1. Clone your fork
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in test credentials
4. Run development server: `npm run dev`
5. Make your changes
6. Run linting: `npm run lint`
7. Test the application

## Coding Standards

### TypeScript
- Use TypeScript for all new code
- Enable strict mode in tsconfig.json
- Add type annotations for function parameters and returns
- Avoid using `any` types

### React
- Use functional components with hooks
- Follow React best practices and conventions
- Use meaningful component names
- Add PropTypes or TypeScript interfaces for props

### Code Style
- Follow the existing code style
- Use 2-space indentation
- Use single quotes for strings
- Use semicolons
- Keep lines under 100 characters when possible

### Naming Conventions
- Components: PascalCase (e.g., `UserProfile.tsx`)
- Functions/variables: camelCase (e.g., `handleSubmit`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_URL`)
- CSS classes: kebab-case (e.g., `user-profile`)

## Commit Message Guidelines

Write clear, descriptive commit messages:

```
feat: Add new feature description
fix: Fix issue description
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add/update tests
chore: Update dependencies
```

## Testing

Before submitting a PR:
- Ensure TypeScript compilation succeeds: `npm run lint`
- Test in development mode: `npm run dev`
- Test the production build: `npm run build`
- Verify no console errors or warnings

## Documentation

- Update README.md if adding new features
- Add comments to complex logic
- Update API documentation if modifying endpoints
- Include examples in PRs for new features

## Review Process

1. Your PR will be reviewed by maintainers
2. Requested changes will be made clear
3. Once approved, your PR will be merged
4. Your contribution will be acknowledged

## Questions?

Feel free to open a discussion or issue if you have questions. We're here to help!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

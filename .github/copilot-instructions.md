# Copilot Instructions for pagerduty-send-event

This repository contains a GitHub Action for sending events to PagerDuty to
trigger, acknowledge, or resolve incidents.

## GitHub Actions Best Practices

When making changes to this action:

- Keep the action focused on a single purpose
- Use semantic versioning with a major version tag (e.g., `v1`) that users can
  reference
- Validate all inputs and provide clear error messages using `@actions/core`
- Use `core.setFailed()` for errors that should fail the workflow
- Use `core.info()`, `core.warning()`, and `core.error()` for logging
- Document all inputs and outputs in `action.yml` with clear descriptions and
  defaults
- Ensure the action works on all GitHub-hosted runner environments
- Keep the `dist/` folder up to date by running `npm run bundle` before
  committing
- Follow the
  [GitHub Actions toolkit documentation](https://github.com/actions/toolkit)

## Conventional Commits

This repository uses
[release-please](https://github.com/googleapis/release-please) for automated
releases. All commits must follow the
[Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - A new feature (triggers minor version bump)
- `fix:` - A bug fix (triggers patch version bump)
- `docs:` - Documentation only changes
- `style:` - Changes that don't affect code meaning (formatting, etc.)
- `refactor:` - Code changes that neither fix bugs nor add features
- `perf:` - Performance improvements
- `test:` - Adding or correcting tests
- `chore:` - Changes to the build process or auxiliary tools
- `ci:` - Changes to CI configuration files

For breaking changes, add `BREAKING CHANGE:` in the commit footer or use `!`
after the type (e.g., `feat!:`). This triggers a major version bump.

## Test Suite

Always run and update the test suite when making changes:

1. Run tests with `npm test` or `npm run ci-test`
2. Ensure all existing tests pass before submitting changes
3. Add new tests for any new functionality or bug fixes
4. Follow the existing test patterns in `__tests__/` directory
5. Mock external dependencies (e.g., `@actions/core`, `superagent`)
6. Aim to maintain or improve code coverage
7. Test both success and error paths

## Package and Dependencies

Before making dependency changes:

1. Check for the latest stable versions of packages on npm
2. Review changelogs for breaking changes before updating major versions
3. Run `npm outdated` to see which packages need updates
4. Use `npm audit` to check for security vulnerabilities
5. Update `package-lock.json` by running `npm install` after changes
6. Test thoroughly after any dependency updates

Key dependencies:

- `@actions/core` - GitHub Actions toolkit for inputs, outputs, and logging
- `@actions/github` - GitHub API client and context
- `superagent` - HTTP client for API requests

## Code Quality

- Run `npm run lint` to check for linting errors
- Run `npm run format:write` to format code with Prettier
- Run `npm run all` to run the complete quality pipeline (format, lint, test,
  coverage, package)
- Follow ESLint rules defined in `.github/linters/.eslintrc.yml`
- Use JavaScript (ES2023) features supported by Node.js 20+
- Prefer async/await over raw Promises
- Handle errors gracefully with try/catch blocks

## Building and Bundling

The action uses `@vercel/ncc` to bundle the source code:

1. Source code is in `src/`
2. Run `npm run bundle` to format and package the action
3. The bundled output goes to `dist/index.js`
4. Always commit the `dist/` folder with your changes
5. The pre-commit hook automatically runs bundling

## File Structure

- `src/index.js` - Action entrypoint
- `src/main.js` - Main action logic
- `__tests__/` - Jest test files
- `action.yml` - Action metadata and interface definition
- `dist/` - Bundled action code (auto-generated, must be committed)

## Security

- Never log sensitive information like integration keys
- Use `core.setSecret()` to mask sensitive values in logs
- Validate and sanitize all inputs
- Keep dependencies updated to avoid security vulnerabilities
- Review security alerts from Dependabot

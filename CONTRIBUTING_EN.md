# 🤝 Contributing to Control Your Skills

Thank you for your interest in **Control Your Skills**! I'm excited you want to contribute. It's people like you that make this tool better for everyone.

Before you submit any code or open an issue, please take a few minutes to read this guide.

## 🐛 Reporting a Bug or 💡 Proposing a Feature

If you have found a bug or have a great idea for a new feature, please open an issue on [GitHub Issues](https://github.com/KlayPeter/control-yours-skills/issues).

When submitting an issue, please try to include:
- A clear description of the problem or the desired goal of the new feature.
- Steps to reproduce (if it's a bug).
- Your OS version and the application version.
- Relevant screenshots or screen recordings (these are incredibly helpful for debugging).

## 🛠️ Local Development Guide

If you'd like to fix a bug or develop a feature yourself, I welcome Pull Requests (PRs)!

### 1. Prerequisites

Ensure your local development environment has the following installed:
- **Node.js** (v20 or higher is recommended)
- **pnpm** (Recommended package manager)

### 2. Clone and Install

```bash
# Clone the repository
git clone https://github.com/KlayPeter/control-yours-skills.git

# Enter the directory
cd control-yours-skills

# Install dependencies
pnpm install
```

### 3. Running Locally

This project is a desktop application combining a Next.js frontend with an Electron backend. You can start the local development environment with the following command:

```bash
# Start the local development server with hot-reloading
pnpm run dev
```

This command will start the Next.js server and launch the Electron desktop window loaded with the development page.

### 4. Build and Package

If you want to verify that the build succeeds, or if you want to package the application locally:

```bash
# Verify code and execute the build
pnpm run build

# Package into an executable for your current system (.dmg for Mac or .exe for Windows)
pnpm run dist
```
The generated installers will be located in the `release/` directory.

## 📝 Submitting a Pull Request (PR)

1. **Fork** this repository to your own GitHub account.
2. Create a new branch from `main` for your work:
   ```bash
   git checkout -b feature/my-awesome-feature
   # Or for a bug fix:
   git checkout -b fix/issue-123
   ```
3. Make your code changes, ensuring they follow the project's coding style.
4. Run `pnpm run check` to ensure there are no type errors, and `pnpm run lint` to ensure style compliance.
5. Commit your changes and push to your fork:
   ```bash
   git commit -m "feat: added an awesome new feature"
   git push origin feature/my-awesome-feature
   ```
6. Go back to the GitHub page and open a Pull Request against the original `main` branch.

## 📜 Coding Standards

- This project is written in **TypeScript**. Please try to include necessary type definitions and avoid using `any` when possible.
- The frontend framework is **Next.js (App Router)** + **React**, and styling is managed with **Tailwind CSS**.
- Please try to follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for your commit messages (e.g., `feat: xxx`, `fix: xxx`, `docs: xxx`, `chore: xxx`).

## 🙏 Thank You Again

Every line of code and piece of feedback is incredibly valuable to me. Thank you for helping make Control Your Skills awesome!

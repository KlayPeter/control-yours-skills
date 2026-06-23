# Control Your Skills

`Control Your Skills` is a local-first desktop Skill Manager built with Electron, Next.js, and TypeScript. It helps you review, stage, and install skills from local ZIP files, GitHub repositories, remote ZIP sources, and workspace skill directories.

## Download

- [Latest Release](https://github.com/KlayPeter/control-yours-skills/releases/latest)

For normal users, open the latest GitHub Release and download the Windows installer:

- `Control Your Skills-Setup-<version>.exe`

After download, run the installer and follow the setup wizard.

## Features

- Electron desktop workspace for skill management
- SQLite local data storage
- Local ZIP import with `SKILL.md` parsing
- GitHub repository and remote ZIP analysis before installation
- Workspace provider scanning for `.codex`, `.claude`, and `.agents`
- Installed skill export, logs, staging, and installation history

## Current Remote Source Behavior

- Local ZIP files can be parsed and installed directly from the app.
- GitHub repository URLs are analyzed for metadata, README excerpts, and manual installation guidance.
- Direct remote `.zip` URLs can be analyzed and staged, but are currently treated as review-first sources instead of one-click installs.
- Remote sources are intentionally conservative right now: the app explains what it found before copying anything into your local skill directories.

## Roadmap

Planned improvements for upcoming phases:

- Clarify product wording and onboarding so the app always matches its real behavior.
- Make workspace and install-directory views easier to understand.
- Add stronger validation and test coverage for import, staging, and install flows.
- Support GitHub repository one-click install after the remote-source flow is hardened and made safer.
- Expand packaged installers beyond the current Windows-first release path.

## Requirements

- Windows, macOS, or Linux for local development
- Node.js 24+
- npm 11+

The published release currently ships as a Windows installer. The local ZIP parsing path uses a Node-based extractor and does not require PowerShell.

## Local Development

Install dependencies:

```bash
npm install
```

If disk space is tight, you can keep npm, temp, and Electron caches inside the repo:

```powershell
$env:npm_config_cache='F:\personal\poject\control-your-skills\.npm-cache'
$env:TEMP='F:\personal\poject\control-your-skills\.tmp'
$env:TMP='F:\personal\poject\control-your-skills\.tmp'
npm install
```

Run the app in development mode:

```bash
npm run dev
```

This starts:

- Next.js dev server at `http://127.0.0.1:3211`
- Electron main/preload watch build
- Electron desktop window

Useful commands:

```bash
npm run dev:web
npm run electron:ensure
npm run build
npm run test
```

## Build A Windows Installer

Create a local Windows installer:

```bash
npm run build
npm run dist:win
```

The generated installer will be written to:

```text
release/
```

## Publish A GitHub Release

This repository includes a GitHub Actions workflow at `.github/workflows/release.yml`.

Release flow:

1. Update the version in `package.json`.
2. Commit and push your changes.
3. Create a Git tag like `v0.1.0`.
4. Push the tag:

```bash
git push origin v0.1.0
```

GitHub Actions will then:

- install dependencies
- build the app bundle
- build the Electron app
- generate the Windows NSIS installer
- publish the installer to GitHub Releases

## Notes

- The release workflow currently targets Windows only.
- Release publishing uses the built-in `GITHUB_TOKEN`.
- The packaged app starts its bundled Next.js standalone server automatically in production.
- GitHub repository one-click install is planned, but it is not implemented yet. For now, repository links are analyzed and summarized before any manual install steps are shown.
- If local Windows packaging fails with a symbolic link permission error from `winCodeSign`, run the build terminal as Administrator or enable Windows Developer Mode. GitHub Actions is the recommended path for public releases.

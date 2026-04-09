# ZN blocker

ZN blocker is a Manifest V3 browser extension focused on YouTube cleanup, tracker blocking, and ad-surface suppression across Chromium-based browsers.

## Key Features

- Global tracker blocking using generated EasyPrivacy-compatible rules.
- Global ad blocking using generated EasyList and AdGuard Base rules.
- YouTube-specific request filtering for ad and telemetry endpoints.
- My Ad Center and sponsored surface cleanup on YouTube UI.
- Flash and animated banner ad suppression on general websites.
- Built-in diagnostics view with ruleset counters and reset controls.
- Modern responsive popup, settings, and diagnostics pages.

## Browser Support

- Google Chrome (desktop)
- Microsoft Edge (desktop)
- Other Chromium-based browsers that support Manifest V3 and Declarative Net Request

## Install From Release Assets

1. Go to the project Releases page on GitHub.
2. Download the latest package for your browser.
3. Preferred package type is CRX:
    - `ZN-blocker-vX.Y.Z-chrome.crx`
    - `ZN-blocker-vX.Y.Z-edge.crx`
    - `ZN-blocker-vX.Y.Z-chromium.crx`
4. ZIP packages are also included for manual unpacked installs.
5. Open your browser extension page:
    - Chrome: `chrome://extensions`
    - Edge: `edge://extensions`
6. Enable Developer mode.
7. If CRX direct install is blocked by browser policy, use Load unpacked with ZIP extraction.
8. Select the extracted folder.

## Install From Source

1. Clone this repository.
2. Optional: regenerate assets and rules:

```bash
npm run build:icons
npm run build:rules
```

Rule generation pulls current filter databases from:

- https://easylist.to/easylist/easylist.txt
- https://filters.adtidy.org/extension/chromium/filters/2.txt

3. Load unpacked using Chrome/Edge extension page.

## Development Commands

```bash
npm run build:icons
npm run build:rules
npm run build:release
```

## Release Packaging

- Packaging script: `scripts/package-release.ps1`
- Output folder: `dist/`
- Produces browser-targeted CRX and ZIP assets plus SHA256 checksums.
- Uses signing key: `keys/zn-blocker-release.pem` (generated automatically on first packaging run).

## Contributing

To apply as a contributor, use the Contributor Application issue form:

1. Open GitHub Issues.
2. Choose Contributor Application.
3. Fill your background, areas of contribution, and sample work.

Before submitting code:

- Read `CONTRIBUTING.md`
- Follow `CODE_OF_CONDUCT.md`
- Keep pull requests focused and clearly described

## Security Reporting

Please do not post security issues publicly first.

Follow `SECURITY.md` for responsible disclosure steps.

## Project Boundaries

This project focuses on tracker and ad-surface cleanup. It does not implement bypass logic for platform access-control enforcement.

## License

This repository is licensed under the ZN Blocker Community Non-Commercial License v1.0.

- Free to use, modify, and share for non-commercial purposes.
- Commercial use, resale, paid hosting, SaaS monetization, or paid redistribution is prohibited.

See `LICENSE` for full terms.
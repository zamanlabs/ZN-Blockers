# OrbitBlocker Release Notes

This document tracks public milestone highlights for OrbitBlocker.

## v1.1.3 (Current Stable)

Release date: 2026-04-10

### What's New

- Simplified popup UX with a central master ON/OFF control.
- Added startup engine-ring animation for unified shield activation.
- Added expandable feature controls with individual per-feature toggles.
- Added YouTube Playback Compatibility mode that auto-handles playback-warning scenarios by switching YouTube filtering to compatibility mode.
- Added opt-in YouTube Pre-Play Compatibility mode to switch YouTube into compatibility mode before playback starts on watch/shorts/live pages.
- Added Support the Developer Send Money popup with QR payment image.

### Blocking and Detection Improvements

- Expanded provider hard-shield coverage for ad/tracker endpoints.
- Expanded OEM and telemetry endpoint coverage.
- Added targeted ad test-script blocking and early cosmetic hiding improvements.
- Updated latest validation snapshot to 100% test pass (133/133 blocked).

### UI and Documentation Updates

- Refreshed README and project markdown structure for a cleaner public presentation.
- Added latest test-result screenshot and updated metrics.
- Renamed release notes file to the versioned format used for this release.

### Included Release Asset Pattern

- `OrbitBlocker-v1.1.3-chrome.crx`
- `OrbitBlocker-v1.1.3-edge.crx`
- `OrbitBlocker-v1.1.3-chromium.crx`
- `OrbitBlocker-v1.1.3-*.zip`
- `OrbitBlocker-v1.1.3-SHA256SUMS.txt`

### Test Result Snapshot

![OrbitBlocker test result showing 100 percent score with all checks blocked](assets/screenshots/block-test-2026-04-10.jpeg)

- Blocking score: **100%**
- Total checks: **133**
- Blocked checks: **133**
- Remaining checks: **0**

## v1.1.2

- Provider hard-shield and OEM telemetry hardening pass.
- Facebook sponsored filtering improvements.
- Diagnostics and manual-rule workflow refinements.

## v0.1.0 (Initial Public Release)

- Initial MV3 extension release for Chromium-based browsers.
- Baseline YouTube ad/tracker suppression and global list integration.
- Initial diagnostics and extension UI controls.

## Licensing Notes

- Licensed under the ZN Blocker Community Non-Commercial License v1.0.
- Commercial or monetized usage is not permitted.

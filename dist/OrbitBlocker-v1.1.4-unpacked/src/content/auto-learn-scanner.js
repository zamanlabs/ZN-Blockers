(() => {
if (globalThis.__znBlockerAutoLearnScannerLoaded) {
  return;
}

globalThis.__znBlockerAutoLearnScannerLoaded = true;

const DEFAULT_SETTINGS = Object.freeze({
  blockAutoLearningEnabled: true
});

const URL_ATTR_SELECTORS = [
  "a[href]",
  "area[href]",
  "iframe[src]",
  "script[src]",
  "img[src]",
  "source[src]",
  "video[src]",
  "audio[src]",
  "link[href]",
  "[data-href]",
  "[data-url]",
  "[data-destination]"
].join(",");

const URL_ATTR_KEYS = ["href", "src", "data-href", "data-url", "data-destination"];
const MAX_URLS_PER_SCAN = 120;
const RESCAN_DELAY_MS = 2200;
const SUPPRESSED_SCAN_SITE_SUFFIXES = Object.freeze([
  "youtube.com",
  "youtube-nocookie.com",
  "google.com",
  "googleusercontent.com",
  "googlevideo.com",
  "github.com"
]);

let scanningEnabled = true;
let extensionContextAlive = true;
let scanTimer = null;
let observer = null;

function isContextInvalidError(error) {
  const message = String(error?.message || error || "");
  return /Extension context invalidated/i.test(message);
}

function markContextInvalid() {
  if (!extensionContextAlive) {
    return;
  }

  extensionContextAlive = false;
  applyScanningState(false);
}

function isRuntimeAvailable() {
  try {
    return Boolean(chrome?.runtime?.id);
  } catch {
    return false;
  }
}

function parseHttpUrl(rawUrl, baseUrl = window.location.href) {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    return null;
  }

  try {
    const parsed = new URL(rawUrl, baseUrl);

    if (!/^https?:$/i.test(parsed.protocol)) {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}

function isSuppressedScanSite() {
  const host = (window.location.hostname || "").toLowerCase();

  if (!host) {
    return false;
  }

  return SUPPRESSED_SCAN_SITE_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`)
  );
}

function collectCandidateUrls(root = document) {
  if (!scanningEnabled) {
    return [];
  }

  const candidates = new Set();
  const elements = [];

  if (root instanceof Element && root.matches(URL_ATTR_SELECTORS)) {
    elements.push(root);
  }

  if (root instanceof Document || root instanceof Element) {
    elements.push(...root.querySelectorAll(URL_ATTR_SELECTORS));
  }

  for (const element of elements) {
    if (candidates.size >= MAX_URLS_PER_SCAN) {
      break;
    }

    for (const key of URL_ATTR_KEYS) {
      const rawValue = element.getAttribute?.(key);
      const normalized = parseHttpUrl(rawValue);

      if (!normalized) {
        continue;
      }

      candidates.add(normalized);

      if (candidates.size >= MAX_URLS_PER_SCAN) {
        break;
      }
    }
  }

  return [...candidates];
}

function sendCandidates(urls) {
  if (
    !scanningEnabled ||
    !extensionContextAlive ||
    !Array.isArray(urls) ||
    urls.length === 0
  ) {
    return;
  }

  if (!isRuntimeAvailable()) {
    markContextInvalid();
    return;
  }

  try {
    const sendResult = chrome.runtime.sendMessage({
      type: "AUTO_LEARN_PAGE_URLS",
      pageUrl: window.location.href,
      urls
    });

    // In some extension environments this returns void, in others it returns a Promise.
    if (sendResult && typeof sendResult.catch === "function") {
      sendResult.catch((error) => {
        if (isContextInvalidError(error)) {
          markContextInvalid();
        }
      });
    }
  } catch (error) {
    if (isContextInvalidError(error)) {
      markContextInvalid();
    }
  }
}

function runScan(root = document) {
  const urls = collectCandidateUrls(root);
  sendCandidates(urls);
}

function queueRescan() {
  if (!scanningEnabled || !extensionContextAlive || scanTimer) {
    return;
  }

  scanTimer = setTimeout(() => {
    scanTimer = null;
    runScan(document);
  }, RESCAN_DELAY_MS);
}

function startObserver() {
  if (observer || !document.documentElement || isSuppressedScanSite()) {
    return;
  }

  observer = new MutationObserver((mutations) => {
    if (!scanningEnabled) {
      return;
    }

    let hasAddedElement = false;

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element) {
          hasAddedElement = true;
          break;
        }
      }

      if (hasAddedElement) {
        break;
      }
    }

    if (hasAddedElement) {
      queueRescan();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

function stopObserver() {
  if (!observer) {
    return;
  }

  observer.disconnect();
  observer = null;
}

function applyScanningState(enabled) {
  scanningEnabled = Boolean(enabled);

  if (!scanningEnabled) {
    if (scanTimer) {
      clearTimeout(scanTimer);
      scanTimer = null;
    }

    stopObserver();
    return;
  }

  if (isSuppressedScanSite()) {
    stopObserver();
    return;
  }

  runScan(document);
  queueRescan();
  startObserver();
}

try {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    const runtimeError = chrome.runtime?.lastError;

    if (runtimeError && isContextInvalidError(runtimeError)) {
      markContextInvalid();
      return;
    }

    if (!extensionContextAlive) {
      return;
    }

    applyScanningState(Boolean(settings.blockAutoLearningEnabled));
  });
} catch (error) {
  if (isContextInvalidError(error)) {
    markContextInvalid();
  }
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (!extensionContextAlive) {
    return;
  }

  if (areaName !== "sync" || !changes.blockAutoLearningEnabled) {
    return;
  }

  applyScanningState(Boolean(changes.blockAutoLearningEnabled.newValue));
});
})();

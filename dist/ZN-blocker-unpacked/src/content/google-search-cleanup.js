(() => {
if (globalThis.__znBlockerGoogleSearchCleanupLoaded) {
  return;
}

globalThis.__znBlockerGoogleSearchCleanupLoaded = true;

const DEFAULT_SETTINGS = Object.freeze({
  blockGlobalAdsEnabled: true
});

const GOOGLE_SEARCH_HOST_REGEX = /(^|\.)google\.[a-z.]+$/i;
const GOOGLE_SEARCH_PATHNAME = "/search";

const AD_CONTAINER_SELECTORS = [
  "#tads",
  "#tadsb",
  "#bottomads",
  "#rhsads",
  "div[data-text-ad='1']",
  "div[data-ta-slot]",
  "div.commercial-unit-desktop-rhs",
  "div.pla-unit-container"
].join(",");

const RESULT_CONTAINER_SELECTORS = [
  "div[data-text-ad='1']",
  "div.uEierd",
  "div.MjjYud",
  "div.g"
].join(",");

const SPONSORED_SIGNAL_SELECTORS = [
  "span[aria-label*='Sponsored' i]",
  "div[aria-label*='Sponsored' i]",
  "span[title*='Sponsored' i]",
  "div[title*='Sponsored' i]"
].join(",");

const AD_DESTINATION_SELECTORS = [
  "a[href*='googleadservices.com']",
  "a[href*='doubleclick.net']",
  "a[href*='/aclk?']",
  "a[href*='adurl=']"
].join(",");

let cleanupEnabled = true;
let observer = null;
let cleanupQueued = false;

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isGoogleSearchPage() {
  const host = String(window.location.hostname || "").toLowerCase();
  const path = String(window.location.pathname || "").toLowerCase();

  if (!GOOGLE_SEARCH_HOST_REGEX.test(host)) {
    return false;
  }

  return path === GOOGLE_SEARCH_PATHNAME;
}

if (!isGoogleSearchPage()) {
  return;
}

function queryAllIncludingRoot(root, selector) {
  const results = [];

  if (root instanceof Element && root.matches(selector)) {
    results.push(root);
  }

  if (!(root instanceof Element) && !(root instanceof Document)) {
    return results;
  }

  results.push(...root.querySelectorAll(selector));
  return results;
}

function hideElement(element) {
  element.style.setProperty("display", "none", "important");
  element.setAttribute("data-zn-blocker-google-sponsored", "hidden");
}

function looksLikeSponsoredLabel(text) {
  const normalized = normalizeText(text);

  if (!normalized) {
    return false;
  }

  return normalized === "sponsored" || normalized === "ad" || normalized === "ads";
}

function isSponsoredResultContainer(container) {
  if (!(container instanceof Element)) {
    return false;
  }

  if (container.querySelector(AD_DESTINATION_SELECTORS)) {
    return true;
  }

  if (container.querySelector(SPONSORED_SIGNAL_SELECTORS)) {
    return true;
  }

  const textNodes = container.querySelectorAll("span, div");
  const maxChecks = Math.min(textNodes.length, 20);

  for (let index = 0; index < maxChecks; index += 1) {
    const text = textNodes[index].textContent || "";

    if (looksLikeSponsoredLabel(text)) {
      return true;
    }
  }

  return false;
}

function hideKnownAdContainers(root = document) {
  const containers = queryAllIncludingRoot(root, AD_CONTAINER_SELECTORS);

  for (const container of containers) {
    hideElement(container);
  }
}

function hideSponsoredResultCards(root = document) {
  const containers = queryAllIncludingRoot(root, RESULT_CONTAINER_SELECTORS);

  for (const container of containers) {
    if (!isSponsoredResultContainer(container)) {
      continue;
    }

    hideElement(container);
  }
}

function runCleanup(root = document) {
  hideKnownAdContainers(root);
  hideSponsoredResultCards(root);
}

function queueCleanup() {
  if (!cleanupEnabled || cleanupQueued) {
    return;
  }

  cleanupQueued = true;

  queueMicrotask(() => {
    cleanupQueued = false;
    runCleanup(document);
  });
}

function startObserver() {
  if (observer || !document.documentElement) {
    return;
  }

  observer = new MutationObserver((mutations) => {
    if (!cleanupEnabled) {
      return;
    }

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) {
          continue;
        }

        runCleanup(node);
      }
    }

    queueCleanup();
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

function applyState(enabled) {
  cleanupEnabled = Boolean(enabled);

  if (cleanupEnabled) {
    runCleanup(document);
    startObserver();
    return;
  }

  stopObserver();
}

chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
  applyState(Boolean(settings.blockGlobalAdsEnabled));
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync" || !changes.blockGlobalAdsEnabled) {
    return;
  }

  applyState(Boolean(changes.blockGlobalAdsEnabled.newValue));
});
})();

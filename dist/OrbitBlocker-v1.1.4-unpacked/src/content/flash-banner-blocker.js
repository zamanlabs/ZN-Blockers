(() => {
if (globalThis.__znBlockerFlashBannerBlockerLoaded) {
  return;
}

globalThis.__znBlockerFlashBannerBlockerLoaded = true;

const DEFAULT_SETTINGS = Object.freeze({
  blockFlashBannersEnabled: true
});

const EARLY_HIDE_SELECTORS = [
  ".adsbox",
  "#adsbox",
  "[class*='adsbox' i]",
  "[id*='adsbox' i]",
  "[class*='ad-slot' i]",
  "[id*='ad-slot' i]",
  "[class*='adunit' i]",
  "[id*='adunit' i]",
  "#interads",
  ".interads",
  ".interads-close",
  ".interads-kkcount-down",
  ".rIdHlTQAtJaQ",
  ".rIdHlTQAtJaQ-bg",
  ".an-sponsored"
].join(",");

const DEFINITE_AD_SELECTORS = [
  "ins.adsbygoogle",
  "[data-ad-slot]",
  "[data-ad-client]",
  "[data-ad-format]",
  "[data-ad-unit]",
  "[data-google-query-id]",
  "object[type='application/x-shockwave-flash']",
  "embed[type='application/x-shockwave-flash']",
  "object[data$='.swf' i]",
  "embed[src$='.swf' i]",
  "iframe[src*='doubleclick.net']",
  "iframe[src*='googlesyndication.com']",
  "iframe[src*='googleadservices.com']",
  "iframe[src*='adservice.google.']",
  "iframe[src*='adnxs.com']",
  "iframe[src*='taboola.com']",
  "iframe[src*='outbrain.com']",
  "iframe[src*='bannersnack.com/iframe/embed.js' i]",
  "#interads",
  "#interads-bar",
  "#interads-cnt",
  "#interads-tit",
  "#inter-mess",
  ".interads",
  ".interads-close",
  ".interads-kkcount-down",
  ".rIdHlTQAtJaQ",
  ".rIdHlTQAtJaQ-bg",
  ".rIdHlTQAtJaQ-default",
  ".an-sponsored",
  ".an-advert-banner"
].join(",");

const AD_NAME_HINT_SELECTORS = [
  "[id*='ad-banner' i]",
  "[class*='ad-banner' i]",
  "[id*='banner-ad' i]",
  "[class*='banner-ad' i]",
  "[id*='sponsored-banner' i]",
  "[class*='sponsored-banner' i]",
  "[id*='sponsor-banner' i]",
  "[class*='sponsor-banner' i]",
  "[id*='promo-banner' i]",
  "[class*='promo-banner' i]",
  "[id*='sticky-ad' i]",
  "[class*='sticky-ad' i]",
  "[id*='interstitial' i]",
  "[class*='interstitial' i]",
  "[id*='interads' i]",
  "[class*='interads' i]"
].join(",");

const BANNER_DIMENSIONS = new Set([
  "728x90",
  "970x90",
  "970x250",
  "300x250",
  "300x600",
  "160x600",
  "320x50",
  "320x100",
  "468x60"
]);

const AD_TOKEN_REGEX = /(^|[\W_])(ad|ads|advert|sponsor|sponsored|promo|promoted)([\W_]|$)/i;
const BANNER_TOKEN_REGEX = /(^|[\W_])(banner|billboard|leaderboard)([\W_]|$)/i;
const INTERSTITIAL_SECTION_TEXT_REGEX =
  /did you receive a interstitial ad|^\s*interstitial ads\s*$/i;
const CLEANUP_THROTTLE_MS = 180;

let blockingEnabled = true;
let observer = null;
let cleanupTimer = null;

function injectEarlyHideStyle() {
  if (!document.documentElement) {
    return;
  }

  if (document.getElementById("zn-blocker-early-cosmetic-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "zn-blocker-early-cosmetic-style";
  style.textContent = `${EARLY_HIDE_SELECTORS}{display:none !important;visibility:hidden !important;}`;

  (document.head || document.documentElement).appendChild(style);
}

function hideElement(element, markerAttribute = "data-zn-blocker-banner-hidden") {
  if (!(element instanceof Element)) {
    return;
  }

  element.style.setProperty("display", "none", "important");
  element.style.setProperty("visibility", "hidden", "important");
  element.style.setProperty("pointer-events", "none", "important");
  element.setAttribute(markerAttribute, "true");
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

function getElementIdentityText(element) {
  const className = typeof element.className === "string" ? element.className : "";
  return `${element.id || ""} ${className}`.trim();
}

function hasAdBannerTokens(element) {
  const identity = getElementIdentityText(element);

  if (!identity) {
    return false;
  }

  return AD_TOKEN_REGEX.test(identity) && BANNER_TOKEN_REGEX.test(identity);
}

function hasBannerDimensions(element) {
  const width = Math.round(element.getBoundingClientRect().width || 0);
  const height = Math.round(element.getBoundingClientRect().height || 0);

  if (!width || !height) {
    return false;
  }

  return BANNER_DIMENSIONS.has(`${width}x${height}`);
}

function isLikelyBannerAd(element) {
  if (!(element instanceof Element)) {
    return false;
  }

  if (element.matches("ins.adsbygoogle, iframe, object, embed")) {
    return true;
  }

  if (hasAdBannerTokens(element)) {
    return true;
  }

  if (AD_TOKEN_REGEX.test(getElementIdentityText(element)) && hasBannerDimensions(element)) {
    return true;
  }

  return false;
}

function hideDefiniteAds(root = document) {
  const candidates = queryAllIncludingRoot(root, DEFINITE_AD_SELECTORS);

  for (const candidate of candidates) {
    hideElement(candidate);
  }
}

function hideLikelyBanners(root = document) {
  const candidates = queryAllIncludingRoot(root, AD_NAME_HINT_SELECTORS);

  for (const candidate of candidates) {
    if (!isLikelyBannerAd(candidate)) {
      continue;
    }

    hideElement(candidate);
  }
}

function hideKnownInterstitialContainers(root = document) {
  const interstitialNodes = queryAllIncludingRoot(
    root,
    "#interads, #interads-bar, #interads-cnt, #interads-tit, #inter-mess, .interads, .interads-close, .interads-kkcount-down, .rIdHlTQAtJaQ, .rIdHlTQAtJaQ-bg, .rIdHlTQAtJaQ-default, .an-sponsored, .an-advert-banner"
  );

  for (const node of interstitialNodes) {
    hideElement(node, "data-zn-blocker-interstitial-hidden");

    const container = node.closest("#interads, .rIdHlTQAtJaQ, .elementor-column, section");
    if (container && container !== node) {
      hideElement(container, "data-zn-blocker-interstitial-hidden");
    }
  }

  const headings = queryAllIncludingRoot(root, "h1, h2, h3, h4, h5");

  for (const heading of headings) {
    const text = (heading.textContent || "").trim();

    if (!text || !INTERSTITIAL_SECTION_TEXT_REGEX.test(text)) {
      continue;
    }

    const section = heading.closest(".elementor-section, .elementor-column, section, article");
    if (section) {
      hideElement(section, "data-zn-blocker-interstitial-hidden");
    }
  }
}

function runCleanup(root = document) {
  hideKnownInterstitialContainers(root);
  hideDefiniteAds(root);
  hideLikelyBanners(root);
}

function queueCleanup() {
  if (cleanupTimer || !blockingEnabled) {
    return;
  }

  cleanupTimer = setTimeout(() => {
    cleanupTimer = null;
    runCleanup(document);
  }, CLEANUP_THROTTLE_MS);
}

function startObserver() {
  if (observer) {
    return;
  }

  observer = new MutationObserver((mutations) => {
    if (!blockingEnabled) {
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
      queueCleanup();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

function stopObserver() {
  if (!observer) {
    if (cleanupTimer) {
      clearTimeout(cleanupTimer);
      cleanupTimer = null;
    }

    return;
  }

  observer.disconnect();
  observer = null;

  if (cleanupTimer) {
    clearTimeout(cleanupTimer);
    cleanupTimer = null;
  }
}

function applyBlockState(enabled) {
  blockingEnabled = Boolean(enabled);

  if (blockingEnabled) {
    injectEarlyHideStyle();
    runCleanup(document);
    startObserver();
    return;
  }

  stopObserver();
}

if (DEFAULT_SETTINGS.blockFlashBannersEnabled) {
  applyBlockState(true);
}

chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
  applyBlockState(Boolean(settings.blockFlashBannersEnabled));
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync" || !changes.blockFlashBannersEnabled) {
    return;
  }

  applyBlockState(Boolean(changes.blockFlashBannersEnabled.newValue));
});

})();
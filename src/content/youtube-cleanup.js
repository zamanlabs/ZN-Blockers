(() => {
if (globalThis.__znBlockerYoutubeCleanupLoaded) {
  return;
}

globalThis.__znBlockerYoutubeCleanupLoaded = true;

const DEFAULT_SETTINGS = Object.freeze({
  cleanupUiAdsEnabled: true,
  blockYoutubeNetworkEnabled: true,
  youtubePlaybackCompatibilityEnabled: true,
  youtubePreplayCompatibilityEnabled: false
});

const AD_RENDERER_SELECTORS = [
  "ytd-display-ad-renderer",
  "ytd-video-masthead-ad-v3-renderer",
  "ytd-ad-slot-renderer",
  "ytd-reel-ad-slot-renderer",
  "ytm-ad-slot-renderer",
  "ytd-action-companion-ad-renderer",
  "ytd-banner-promo-renderer",
  "ytd-promoted-sparkles-web-renderer",
  "ytd-promoted-video-renderer",
  "ytd-in-feed-ad-layout-renderer",
  "ytd-player-legacy-desktop-watch-ads-renderer",
  "ytd-player-ads-renderer",
  "ytd-merch-shelf-ad-renderer",
  "ytd-companion-slot-renderer",
  "ytd-rich-section-renderer ytd-ad-slot-renderer",
  "ytd-search-pyv-renderer",
  "ytm-promoted-sparkles-web-renderer",
  ".ytd-search-pyv-renderer"
];

const AD_CENTER_SELECTORS = [
  "ytd-engagement-panel-section-list-renderer[target-id*='ads']",
  "ytd-engagement-panel-section-list-renderer[target-id*='ad_center']",
  "ytd-engagement-panel-section-list-renderer[target-id*='ad-center']",
  "[id*='my-ad-center']",
  "[id*='ad-center']",
  "[aria-label*='My Ad Center' i]",
  "[aria-label*='From your My Ad Center' i]",
  "[title*='My Ad Center' i]"
];

const MY_AD_CENTER_LINK_SELECTORS = [
  "a[href*='myadcenter.google.com']",
  "a[href*='adsettings.google.com']",
  "[aria-label*='My Ad Center' i]",
  "[aria-label*='From your My Ad Center' i]",
  "[title*='My Ad Center' i]",
  "[title*='From your My Ad Center' i]"
].join(",");

const MY_AD_CENTER_HOST_SELECTOR = [
  "ytd-promoted-sparkles-web-renderer",
  "ytd-promoted-video-renderer",
  "ytd-display-ad-renderer",
  "ytd-ad-slot-renderer",
  "ytd-in-feed-ad-layout-renderer",
  "ytd-player-ads-renderer",
  "ytd-rich-item-renderer",
  "ytd-video-renderer",
  "ytd-grid-video-renderer",
  "ytd-compact-video-renderer",
  "ytd-rich-section-renderer",
  "ytd-item-section-renderer",
  "ytd-engagement-panel-section-list-renderer",
  "ytm-promoted-sparkles-web-renderer",
  "ytm-item-section-renderer"
].join(",");

const CARD_CONTAINER_SELECTOR = [
  "ytd-video-renderer",
  "ytd-grid-video-renderer",
  "ytd-compact-video-renderer",
  "ytd-rich-item-renderer",
  "ytd-item-section-renderer",
  "ytd-rich-section-renderer",
  "ytd-reel-item-renderer",
  "ytd-reel-video-renderer",
  "ytd-horizontal-card-list-renderer",
  "ytm-video-with-context-renderer",
  "ytm-item-section-renderer"
].join(",");

const SPONSORED_BADGE_SELECTORS = [
  "ytd-badge-supported-renderer",
  ".badge-style-type-sponsored",
  "yt-formatted-string.ytd-badge-supported-renderer",
  "ytm-badge-and-byline-renderer",
  "span.badge",
  "span.metadata-badge"
].join(",");

const SPONSORED_PHRASES = [
  "sponsored",
  "sponsored by",
  "sponsor",
  "promoted",
  "brought to you by",
  "paid partnership",
  "paid promotion",
  "includes paid promotion",
  "advertisement",
  "my ad center",
  "from your my ad center"
];

const PLAYER_AD_SELECTORS = [
  "#player-ads",
  ".video-ads",
  ".ytp-ad-module",
  ".ytp-ad-player-overlay",
  ".ytp-ad-preview-container",
  ".ytp-ad-progress-list",
  ".ytp-ad-image-overlay",
  ".ytp-ad-survey",
  ".ytp-ad-action-interstitial",
  ".ytp-ad-overlay-container"
].join(",");

const BYLINE_SPONSORED_SELECTORS = [
  "ytd-video-renderer #byline-container",
  "ytd-video-renderer #metadata-line",
  "ytd-grid-video-renderer #byline-container",
  "ytd-grid-video-renderer #metadata-line",
  "ytd-rich-item-renderer #byline-container",
  "ytd-rich-item-renderer #metadata-line",
  "ytd-compact-video-renderer #byline-container",
  "ytd-compact-video-renderer #metadata-line",
  "ytd-reel-item-renderer #byline-container",
  "ytm-video-with-context-renderer .item-byline",
  "ytm-video-with-context-renderer .secondary-text"
].join(",");

const AD_LINK_SELECTORS = [
  "a[href*='googleadservices.com']",
  "a[href*='doubleclick.net']",
  "a[href*='googlesyndication.com']",
  "a[href*='/aclk?']",
  "a[href*='adurl=']"
].join(",");

const SPONSORED_SECTION_TITLE_SELECTORS = [
  "ytd-rich-section-renderer #title",
  "ytd-item-section-renderer #title",
  "ytm-item-section-renderer .title"
].join(",");

const YOUTUBE_PLAYBACK_PROMPT_SELECTORS = [
  "ytd-enforcement-message-view-model",
  "yt-playability-error-supported-renderers",
  "ytd-popup-container",
  "tp-yt-paper-dialog",
  "ytd-alert-with-button-renderer"
].join(",");

const YOUTUBE_PLAYBACK_PROMPT_PHRASES = [
  "ad blockers violate youtube",
  "video playback is blocked unless youtube",
  "allow youtube ads",
  "youtube terms of service",
  "not using an ad blocker"
];

const COMPATIBILITY_RELOAD_SESSION_KEY = "__znBlockerYoutubeCompatReloadOnce";
const COMPATIBILITY_NOTICE_ID = "zn-blocker-youtube-compat-notice";
const WATCH_PATH_REGEX = /^\/(watch|shorts|live)(?:\b|\/|$)/i;
const COMPATIBILITY_SETTING_PATCH = Object.freeze({
  blockYoutubeNetworkEnabled: false,
  cleanupUiAdsEnabled: false
});

let cleanupEnabled = true;
let observer = null;
let cleanupQueued = false;
let youtubeNetworkShieldEnabled = true;
let playbackCompatibilityEnabled = true;
let preplayCompatibilityEnabled = false;
let compatibilitySwitchInProgress = false;
let compatibilityNoticeTimer = null;

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
  element.setAttribute("data-zn-blocker-hidden", "true");
}

function showCompatibilityNotice(message, isError = false) {
  let notice = document.getElementById(COMPATIBILITY_NOTICE_ID);

  if (!notice) {
    notice = document.createElement("div");
    notice.id = COMPATIBILITY_NOTICE_ID;
    notice.style.cssText =
      "position:fixed;right:14px;bottom:14px;z-index:2147483647;max-width:340px;padding:10px 12px;border-radius:10px;font:600 12px/1.4 sans-serif;color:#fff;box-shadow:0 10px 22px rgba(0,0,0,.35);";
    document.documentElement.appendChild(notice);
  }

  notice.textContent = message;
  notice.style.background = isError ? "rgba(153, 27, 27, 0.93)" : "rgba(3, 104, 71, 0.93)";

  if (compatibilityNoticeTimer) {
    clearTimeout(compatibilityNoticeTimer);
  }

  compatibilityNoticeTimer = setTimeout(() => {
    notice.remove();
    compatibilityNoticeTimer = null;
  }, 2800);
}

function normalizeText(value) {
  return (value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isWatchPlaybackPage() {
  return WATCH_PATH_REGEX.test(window.location.pathname || "");
}

function isSponsoredText(value) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return false;
  }

  if (SPONSORED_PHRASES.some((phrase) => normalized.includes(phrase))) {
    return true;
  }

  return /^ad([\s.:|\-]|$)/.test(normalized) || /^ads([\s.:|\-]|$)/.test(normalized);
}

function findCardContainer(node) {
  if (!(node instanceof Element)) {
    return null;
  }

  return node.closest(CARD_CONTAINER_SELECTOR);
}

function hideAdRenderers(root = document) {
  for (const selector of AD_RENDERER_SELECTORS) {
    const elements = queryAllIncludingRoot(root, selector);

    for (const element of elements) {
      hideElement(element);
    }
  }
}

function hideAdCenterPanels(root = document) {
  for (const selector of AD_CENTER_SELECTORS) {
    const elements = queryAllIncludingRoot(root, selector);

    for (const element of elements) {
      hideElement(element);
    }
  }
}

function hideSponsoredCards(root = document) {
  const badgeRoots = queryAllIncludingRoot(root, SPONSORED_BADGE_SELECTORS);

  for (const badgeRoot of badgeRoots) {
    const text = normalizeText(badgeRoot.textContent || "");

    if (!isSponsoredText(text)) {
      continue;
    }

    const card = findCardContainer(badgeRoot);

    if (card) {
      hideElement(card);
    }
  }
}

function hideCardsWithAdLinks(root = document) {
  const adLinks = queryAllIncludingRoot(root, AD_LINK_SELECTORS);

  for (const link of adLinks) {
    const card = findCardContainer(link);

    if (card) {
      hideElement(card);
    }
  }
}

function hideMyAdCenterAds(root = document) {
  const anchors = queryAllIncludingRoot(root, MY_AD_CENTER_LINK_SELECTORS);

  for (const anchor of anchors) {
    const host = anchor.closest(MY_AD_CENTER_HOST_SELECTOR) || findCardContainer(anchor);

    if (host) {
      hideElement(host);
      continue;
    }

    hideElement(anchor);
  }
}

function hidePlayerAdOverlays(root = document) {
  const overlays = queryAllIncludingRoot(root, PLAYER_AD_SELECTORS);

  for (const overlay of overlays) {
    hideElement(overlay);
  }
}

function hideSponsoredBylineCards(root = document) {
  const bylines = queryAllIncludingRoot(root, BYLINE_SPONSORED_SELECTORS);

  for (const byline of bylines) {
    if (!isSponsoredText(byline.textContent || "")) {
      continue;
    }

    const card =
      findCardContainer(byline) ||
      byline.closest(
        "ytd-rich-section-renderer, ytd-item-section-renderer, ytd-reel-item-renderer"
      );

    if (card) {
      hideElement(card);
    }
  }
}

function hideSponsoredSections(root = document) {
  const sectionTitles = queryAllIncludingRoot(root, SPONSORED_SECTION_TITLE_SELECTORS);

  for (const title of sectionTitles) {
    if (!isSponsoredText(title.textContent)) {
      continue;
    }

    const section = title.closest("ytd-rich-section-renderer, ytd-item-section-renderer");

    if (section) {
      hideElement(section);
    }
  }
}

function isYoutubePlaybackPrompt(element) {
  if (!(element instanceof Element)) {
    return false;
  }

  const text = normalizeText(element.textContent || "");

  if (!text || !text.includes("youtube")) {
    return false;
  }

  return YOUTUBE_PLAYBACK_PROMPT_PHRASES.some((phrase) => text.includes(phrase));
}

function findYoutubePlaybackPrompt(root = document) {
  const candidates = queryAllIncludingRoot(root, YOUTUBE_PLAYBACK_PROMPT_SELECTORS);

  for (const candidate of candidates) {
    if (isYoutubePlaybackPrompt(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function enableYoutubePlaybackCompatibility(trigger) {
  if (
    compatibilitySwitchInProgress ||
    !playbackCompatibilityEnabled ||
    !youtubeNetworkShieldEnabled
  ) {
    return;
  }

  compatibilitySwitchInProgress = true;

  try {
    await chrome.storage.sync.set(COMPATIBILITY_SETTING_PATCH);

    cleanupEnabled = false;
    youtubeNetworkShieldEnabled = false;

    const reasonText = trigger === "preplay" ? "before playback" : "after warning detection";
    showCompatibilityNotice(`YouTube compatibility enabled ${reasonText}. Reloading...`);

    if (!sessionStorage.getItem(COMPATIBILITY_RELOAD_SESSION_KEY)) {
      sessionStorage.setItem(COMPATIBILITY_RELOAD_SESSION_KEY, "1");
      setTimeout(() => {
        window.location.reload();
      }, 420);
    }
  } catch (error) {
    console.warn("YouTube compatibility switch failed", error);
    showCompatibilityNotice("Unable to enable YouTube compatibility mode.", true);
  } finally {
    compatibilitySwitchInProgress = false;
  }
}

function maybeEnablePreplayCompatibility() {
  if (
    !preplayCompatibilityEnabled ||
    !playbackCompatibilityEnabled ||
    !youtubeNetworkShieldEnabled ||
    !isWatchPlaybackPage()
  ) {
    return;
  }

  enableYoutubePlaybackCompatibility("preplay").catch((error) => {
    console.warn("YouTube pre-play compatibility failed", error);
  });
}

function maybeHandleYoutubePlaybackPrompt(root = document) {
  if (!playbackCompatibilityEnabled || !youtubeNetworkShieldEnabled) {
    return;
  }

  const prompt = findYoutubePlaybackPrompt(root);

  if (!prompt) {
    return;
  }

  prompt.setAttribute("data-zn-youtube-playback-warning", "detected");
  enableYoutubePlaybackCompatibility("prompt").catch((error) => {
    console.warn("YouTube playback warning handler failed", error);
  });
}

function shouldObserveDom() {
  return cleanupEnabled || (playbackCompatibilityEnabled && youtubeNetworkShieldEnabled);
}

function runCleanup(root = document) {
  hideAdRenderers(root);
  hideAdCenterPanels(root);
  hidePlayerAdOverlays(root);
  hideSponsoredCards(root);
  hideSponsoredBylineCards(root);
  hideCardsWithAdLinks(root);
  hideMyAdCenterAds(root);
  hideSponsoredSections(root);
  maybeHandleYoutubePlaybackPrompt(root);
}

function queueCleanup() {
  if (cleanupQueued || !cleanupEnabled) {
    return;
  }

  cleanupQueued = true;

  queueMicrotask(() => {
    cleanupQueued = false;
    runCleanup(document);
  });
}

function startObserver() {
  if (observer) {
    return;
  }

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) {
          continue;
        }

        maybeHandleYoutubePlaybackPrompt(node);

        if (cleanupEnabled) {
          runCleanup(node);
        }
      }
    }

    if (cleanupEnabled) {
      queueCleanup();
      return;
    }

    maybeHandleYoutubePlaybackPrompt(document);
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

function applyRuntimeSettings(settings) {
  cleanupEnabled = Boolean(settings.cleanupUiAdsEnabled);
  youtubeNetworkShieldEnabled = Boolean(settings.blockYoutubeNetworkEnabled);
  playbackCompatibilityEnabled = Boolean(settings.youtubePlaybackCompatibilityEnabled);
  preplayCompatibilityEnabled = Boolean(settings.youtubePreplayCompatibilityEnabled);

  if (cleanupEnabled) {
    runCleanup(document);
  } else {
    maybeHandleYoutubePlaybackPrompt(document);
  }

  if (shouldObserveDom()) {
    startObserver();
  } else {
    stopObserver();
  }

  maybeEnablePreplayCompatibility();
}

chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
  applyRuntimeSettings(settings);

  if (sessionStorage.getItem(COMPATIBILITY_RELOAD_SESSION_KEY)) {
    sessionStorage.removeItem(COMPATIBILITY_RELOAD_SESSION_KEY);
    showCompatibilityNotice("YouTube compatibility mode is active.");
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (
    areaName !== "sync" ||
    (!changes.cleanupUiAdsEnabled &&
      !changes.blockYoutubeNetworkEnabled &&
      !changes.youtubePlaybackCompatibilityEnabled &&
      !changes.youtubePreplayCompatibilityEnabled)
  ) {
    return;
  }

  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    applyRuntimeSettings(settings);
  });
});

})();
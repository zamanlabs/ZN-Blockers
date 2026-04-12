(() => {
if (globalThis.__znBlockerRedirectPopupGuardLoaded) {
  return;
}

globalThis.__znBlockerRedirectPopupGuardLoaded = true;

const DEFAULT_SETTINGS = Object.freeze({
  blockRedirectPopupsEnabled: true
});

const BLOCKED_HOST_SUFFIXES = [
  "adf.ly",
  "j.gs",
  "q.gs",
  "uii.io",
  "ouo.io",
  "ouo.press",
  "shorte.st",
  "sh.st",
  "clk.sh",
  "adfoc.us",
  "bc.vc",
  "fc.lc",
  "cpmlink.net",
  "linkvertise.com",
  "linkvertise.net",
  "boost.ink",
  "loot-link.com",
  "loot-links.com",
  "onclkds.com",
  "popads.net",
  "popcash.net",
  "propellerads.com",
  "adsterra.com",
  "adsterra.network",
  "ad-maven.com",
  "admaven.com",
  "clickadu.com",
  "hilltopads.net",
  "exoclick.com",
  "trafficstars.com",
  "juicyads.com",
  "yllix.com"
];

const REDIRECT_PARAM_KEYS = new Set([
  "url",
  "u",
  "to",
  "target",
  "dest",
  "destination",
  "redir",
  "redirect",
  "redirect_url",
  "redirecturl",
  "r",
  "next",
  "out",
  "adurl",
  "ad_url",
  "clickurl"
]);

const CLICKTRAP_TOKEN_REGEX =
  /(ad|ads|sponsor|promo|pop|under|click|redirect|redir|download|get\s*link)/i;
const PATH_HINT_REGEX = /\/(?:out|go|away|redirect|redir|click|clk|adclick|r)(?:\b|\/|\.php)/i;
const POPUP_HANDLER_REGEX =
  /(window\.open|open\s*\(|location\.(?:href|assign|replace)|top\.location|parent\.location)/i;

let guardEnabled = true;
let observer = null;
let cleanupQueued = false;
let warningNavigationInProgress = false;

function toLowerSafe(value) {
  return String(value || "").toLowerCase();
}

function decodeValue(value) {
  let next = String(value || "");

  for (let index = 0; index < 2; index += 1) {
    try {
      const decoded = decodeURIComponent(next);

      if (decoded === next) {
        break;
      }

      next = decoded;
    } catch {
      break;
    }
  }

  return next;
}

function tryParseHttpUrl(rawUrl, baseHref = window.location.href) {
  if (typeof rawUrl !== "string") {
    return null;
  }

  const trimmed = rawUrl.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed, baseHref);

    if (!/^https?:$/i.test(parsed.protocol)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function isBlockedHost(hostname) {
  const host = toLowerSafe(hostname);

  if (!host) {
    return false;
  }

  return BLOCKED_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

function getCrossOriginRedirectTarget(urlObject) {
  for (const [rawKey, rawValue] of urlObject.searchParams.entries()) {
    const key = toLowerSafe(rawKey);

    if (!REDIRECT_PARAM_KEYS.has(key)) {
      continue;
    }

    const decodedValue = decodeValue(rawValue).trim();

    if (!decodedValue) {
      continue;
    }

    const nestedUrl = tryParseHttpUrl(decodedValue, urlObject.href);

    if (!nestedUrl) {
      continue;
    }

    if (nestedUrl.origin !== urlObject.origin) {
      return nestedUrl;
    }
  }

  return null;
}

function hasCrossOriginRedirectParam(urlObject) {
  return Boolean(getCrossOriginRedirectTarget(urlObject));
}

function getSuspiciousNavigationInfo(rawUrl, baseHref) {
  if (typeof rawUrl !== "string") {
    return null;
  }

  const candidate = rawUrl.trim();

  if (!candidate || candidate.startsWith("#") || /^javascript:/i.test(candidate)) {
    return null;
  }

  const parsedUrl = tryParseHttpUrl(candidate, baseHref);

  if (!parsedUrl) {
    return null;
  }

  const redirectTarget = getCrossOriginRedirectTarget(parsedUrl);
  const hasBlockedHost = isBlockedHost(parsedUrl.hostname);
  const hasPathHintRedirect = PATH_HINT_REGEX.test(parsedUrl.pathname) && Boolean(redirectTarget);
  const hasTokenizedRedirect = Boolean(redirectTarget) && CLICKTRAP_TOKEN_REGEX.test(parsedUrl.search);

  if (!hasBlockedHost && !hasPathHintRedirect && !hasTokenizedRedirect) {
    return null;
  }

  const targetUrl = redirectTarget ? redirectTarget.href : parsedUrl.href;
  const reason = hasBlockedHost ? "blocked-host" : "redirect-trap";

  return {
    blockedUrl: parsedUrl.href,
    targetUrl,
    reason
  };
}

function isSuspiciousNavigation(rawUrl, baseHref) {
  if (typeof rawUrl !== "string") {
    return false;
  }

  const candidate = rawUrl.trim();

  if (!candidate || candidate.startsWith("#")) {
    return false;
  }

  if (/^javascript:/i.test(candidate)) {
    return POPUP_HANDLER_REGEX.test(candidate);
  }

  return Boolean(getSuspiciousNavigationInfo(candidate, baseHref));
}

function getIdentityText(element) {
  if (!(element instanceof Element)) {
    return "";
  }

  const className = typeof element.className === "string" ? element.className : "";
  const onClick = element.getAttribute("onclick") || "";
  const href = element.getAttribute("href") || element.getAttribute("data-href") || "";

  return `${element.id || ""} ${className} ${onClick} ${href}`.trim();
}

function isMostlyTransparent(style) {
  const opacity = Number.parseFloat(style.opacity || "1");

  if (Number.isFinite(opacity) && opacity <= 0.2) {
    return true;
  }

  const rgbaMatch = /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([0-9.]+)\s*\)/i.exec(
    style.backgroundColor || ""
  );

  if (rgbaMatch && Number.parseFloat(rgbaMatch[1]) <= 0.08) {
    return true;
  }

  return toLowerSafe(style.backgroundColor) === "transparent";
}

function hasPopupInlineHandler(element) {
  return POPUP_HANDLER_REGEX.test(element.getAttribute("onclick") || "");
}

function isLikelyClickTrapOverlay(element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const style = window.getComputedStyle(element);

  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.pointerEvents === "none" ||
    !(style.position === "fixed" || style.position === "absolute")
  ) {
    return false;
  }

  const zIndexValue = Number.parseInt(style.zIndex || "", 10);

  if (!Number.isFinite(zIndexValue) || zIndexValue < 900) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  const viewportWidth = Math.max(window.innerWidth, 1);
  const viewportHeight = Math.max(window.innerHeight, 1);

  if (rect.width < viewportWidth * 0.4 || rect.height < viewportHeight * 0.18) {
    return false;
  }

  const identity = getIdentityText(element);
  const looksLikeAdTrap = CLICKTRAP_TOKEN_REGEX.test(identity);
  const transparent = isMostlyTransparent(style);
  const hasInlineHandler = hasPopupInlineHandler(element);
  const href = element.getAttribute("href") || element.getAttribute("data-href") || "";

  if (isSuspiciousNavigation(href, window.location.href)) {
    return true;
  }

  if (element instanceof HTMLIFrameElement && isSuspiciousNavigation(element.src, window.location.href)) {
    return true;
  }

  return (transparent && (looksLikeAdTrap || hasInlineHandler)) || (looksLikeAdTrap && hasInlineHandler);
}

function markAndHide(element) {
  element.style.setProperty("display", "none", "important");
  element.setAttribute("data-zn-blocker-clicktrap-hidden", "true");
}

function stopEvent(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
  event.stopPropagation();
}

function openHumanNavigationWarning(navigationInfo) {
  if (warningNavigationInProgress || !navigationInfo) {
    return;
  }

  warningNavigationInProgress = true;

  const payload = {
    type: "OPEN_BLOCK_WARNING",
    blockedUrl: navigationInfo.blockedUrl,
    targetUrl: navigationInfo.targetUrl,
    sourceUrl: window.location.href,
    reason: navigationInfo.reason || "suspicious-navigation"
  };

  chrome.runtime.sendMessage(payload, () => {
    if (!chrome.runtime.lastError) {
      return;
    }

    warningNavigationInProgress = false;
    window.location.href = navigationInfo.targetUrl || navigationInfo.blockedUrl;
  });
}

function blockIfSuspiciousAnchor(event, target) {
  const anchor = target.closest("a[href], area[href]");

  if (!anchor) {
    return false;
  }

  const rawHref = anchor.getAttribute("href") || anchor.href;
  const navigationInfo = getSuspiciousNavigationInfo(rawHref, window.location.href);

  if (!navigationInfo) {
    return false;
  }

  stopEvent(event);
  anchor.setAttribute("data-zn-blocker-blocked-redirect", "true");
  openHumanNavigationWarning(navigationInfo);

  return true;
}

function blockIfClickTrap(event, target) {
  const candidate = target.closest("iframe[src], [onclick], [data-href], a[href], button, div, span");

  if (!candidate || !isLikelyClickTrapOverlay(candidate)) {
    return false;
  }

  stopEvent(event);
  markAndHide(candidate);

  return true;
}

function handleCaptureClick(event) {
  if (!guardEnabled || event.defaultPrevented) {
    return;
  }

  const target = event.target;

  if (!(target instanceof Element)) {
    return;
  }

  if (blockIfSuspiciousAnchor(event, target)) {
    return;
  }

  blockIfClickTrap(event, target);
}

function handleCaptureSubmit(event) {
  if (!guardEnabled || event.defaultPrevented) {
    return;
  }

  if (!(event.target instanceof HTMLFormElement)) {
    return;
  }

  const actionUrl = event.target.getAttribute("action") || event.target.action;
  const navigationInfo = getSuspiciousNavigationInfo(actionUrl, window.location.href);

  if (!navigationInfo) {
    return;
  }

  stopEvent(event);
  event.target.setAttribute("data-zn-blocker-blocked-redirect", "true");
  openHumanNavigationWarning(navigationInfo);
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

function runOverlaySweep(root = document) {
  const candidates = queryAllIncludingRoot(
    root,
    "iframe[src], [onclick], [data-href], a[href][target='_blank']"
  );

  for (const candidate of candidates) {
    if (!isLikelyClickTrapOverlay(candidate)) {
      continue;
    }

    markAndHide(candidate);
  }
}

function queueOverlaySweep() {
  if (!guardEnabled || cleanupQueued) {
    return;
  }

  cleanupQueued = true;

  queueMicrotask(() => {
    cleanupQueued = false;
    runOverlaySweep(document);
  });
}

function startObserver() {
  if (observer || !document.documentElement) {
    return;
  }

  observer = new MutationObserver((mutations) => {
    if (!guardEnabled) {
      return;
    }

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) {
          continue;
        }

        runOverlaySweep(node);
      }
    }

    queueOverlaySweep();
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

function applyGuardState(enabled) {
  guardEnabled = Boolean(enabled);

  if (guardEnabled) {
    runOverlaySweep(document);
    startObserver();
    return;
  }

  stopObserver();
}

document.addEventListener("click", handleCaptureClick, {
  capture: true,
  passive: false
});

document.addEventListener("auxclick", handleCaptureClick, {
  capture: true,
  passive: false
});

document.addEventListener("submit", handleCaptureSubmit, {
  capture: true,
  passive: false
});

chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
  applyGuardState(Boolean(settings.blockRedirectPopupsEnabled));
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync" || !changes.blockRedirectPopupsEnabled) {
    return;
  }

  applyGuardState(Boolean(changes.blockRedirectPopupsEnabled.newValue));
});
})();

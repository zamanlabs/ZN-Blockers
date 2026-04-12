(() => {
if (globalThis.__znBlockerManualBlockPickerLoaded) {
  return;
}

globalThis.__znBlockerManualBlockPickerLoaded = true;

const URL_ATTR_KEYS = ["src", "href", "data-src", "data-href", "data-url", "action"];
const MAX_CONTEXT_URLS = 28;
const MAX_SELECTOR_DEPTH = 5;
const HIDE_STYLE_ID = "zn-blocker-manual-hide-style";
const TOAST_STYLE_ID = "zn-blocker-manual-toast-style";
const TOAST_NODE_ID = "zn-blocker-manual-toast";
const TOAST_VISIBLE_CLASS = "zn-blocker-toast-visible";
const TOAST_ERROR_CLASS = "zn-blocker-toast-error";
const TOAST_HIDE_DELAY_MS = 2400;

const cssEscape =
  globalThis.CSS?.escape ||
  ((value) =>
    String(value || "")
      .replace(/[^a-zA-Z0-9_-]/g, "\\$&")
      .replace(/^(-?\d)/, "\\3$1 "));

let lastContextTarget = null;
let lastAppliedPageUrl = "";
let toastTimer = null;

function parseHttpUrl(rawUrl, baseUrl = window.location.href) {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    return null;
  }

  try {
    const parsed = new URL(rawUrl, baseUrl);

    if (!/^https?:$/i.test(parsed.protocol)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function collectElementUrls(targetElement) {
  const urls = new Set();
  let node = targetElement;
  let depth = 0;

  while (node instanceof Element && depth < MAX_SELECTOR_DEPTH) {
    for (const key of URL_ATTR_KEYS) {
      const rawValue = node.getAttribute(key);
      const parsed = parseHttpUrl(rawValue);

      if (!parsed) {
        continue;
      }

      urls.add(parsed.href);

      if (urls.size >= MAX_CONTEXT_URLS) {
        return [...urls];
      }
    }

    if (node instanceof HTMLIFrameElement) {
      const parsed = parseHttpUrl(node.src);

      if (parsed) {
        urls.add(parsed.href);
      }
    }

    if (node instanceof HTMLAnchorElement) {
      const parsed = parseHttpUrl(node.href);

      if (parsed) {
        urls.add(parsed.href);
      }
    }

    if (node instanceof HTMLImageElement || node instanceof HTMLScriptElement) {
      const parsed = parseHttpUrl(node.src);

      if (parsed) {
        urls.add(parsed.href);
      }
    }

    if (urls.size >= MAX_CONTEXT_URLS) {
      break;
    }

    node = node.parentElement;
    depth += 1;
  }

  return [...urls];
}

function buildSelector(targetElement) {
  if (!(targetElement instanceof Element)) {
    return "";
  }

  if (targetElement.id) {
    return `#${cssEscape(targetElement.id)}`;
  }

  const parts = [];
  let node = targetElement;
  let depth = 0;

  while (node instanceof Element && depth < MAX_SELECTOR_DEPTH) {
    let part = node.tagName.toLowerCase();

    if (node.id) {
      part += `#${cssEscape(node.id)}`;
      parts.unshift(part);
      break;
    }

    const classNames = [...node.classList]
      .filter((name) => /^[a-z0-9_-]{2,}$/i.test(name))
      .slice(0, 2);

    if (classNames.length > 0) {
      part += `.${classNames.map((name) => cssEscape(name)).join(".")}`;
    }

    const parent = node.parentElement;

    if (parent) {
      const sameTagSiblings = [...parent.children].filter(
        (child) => child.tagName === node.tagName
      );

      if (sameTagSiblings.length > 1) {
        part += `:nth-of-type(${sameTagSiblings.indexOf(node) + 1})`;
      }
    }

    parts.unshift(part);
    node = parent;
    depth += 1;
  }

  return parts.join(" > ").slice(0, 280);
}

function rememberContextTarget(eventTarget) {
  if (!(eventTarget instanceof Element)) {
    return;
  }

  lastContextTarget = {
    pageUrl: window.location.href,
    selector: buildSelector(eventTarget),
    urls: collectElementUrls(eventTarget),
    capturedAt: Date.now()
  };
}

function ensureHideStyleNode() {
  let styleNode = document.getElementById(HIDE_STYLE_ID);

  if (styleNode instanceof HTMLStyleElement) {
    return styleNode;
  }

  styleNode = document.createElement("style");
  styleNode.id = HIDE_STYLE_ID;
  styleNode.type = "text/css";
  document.documentElement.appendChild(styleNode);
  return styleNode;
}

function ensureToastStyleNode() {
  let styleNode = document.getElementById(TOAST_STYLE_ID);

  if (styleNode instanceof HTMLStyleElement) {
    return styleNode;
  }

  styleNode = document.createElement("style");
  styleNode.id = TOAST_STYLE_ID;
  styleNode.type = "text/css";
  styleNode.textContent = `
    #${TOAST_NODE_ID} {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 2147483647;
      max-width: min(360px, calc(100vw - 30px));
      border-radius: 12px;
      border: 1px solid rgba(12, 98, 88, 0.6);
      background: linear-gradient(145deg, rgba(19, 137, 118, 0.97), rgba(12, 98, 88, 0.97));
      color: #ffffff;
      font: 600 13px/1.35 "Segoe UI", "Trebuchet MS", sans-serif;
      letter-spacing: 0.01em;
      padding: 10px 12px;
      box-shadow: 0 14px 28px rgba(6, 31, 28, 0.35);
      opacity: 0;
      transform: translateY(8px);
      pointer-events: none;
      transition: opacity 160ms ease, transform 160ms ease;
    }

    #${TOAST_NODE_ID}.${TOAST_VISIBLE_CLASS} {
      opacity: 1;
      transform: translateY(0);
    }

    #${TOAST_NODE_ID}.${TOAST_ERROR_CLASS} {
      border-color: rgba(146, 31, 31, 0.7);
      background: linear-gradient(145deg, rgba(183, 41, 41, 0.97), rgba(146, 31, 31, 0.97));
    }
  `;

  document.documentElement.appendChild(styleNode);
  return styleNode;
}

function ensureToastNode() {
  ensureToastStyleNode();

  let toastNode = document.getElementById(TOAST_NODE_ID);

  if (toastNode instanceof HTMLDivElement) {
    return toastNode;
  }

  toastNode = document.createElement("div");
  toastNode.id = TOAST_NODE_ID;
  toastNode.setAttribute("role", "status");
  toastNode.setAttribute("aria-live", "polite");
  document.documentElement.appendChild(toastNode);
  return toastNode;
}

function showActionToast(message, variant = "success") {
  const toastNode = ensureToastNode();
  toastNode.textContent = String(message || "Action complete");
  toastNode.classList.toggle(TOAST_ERROR_CLASS, variant === "error");
  toastNode.classList.add(TOAST_VISIBLE_CLASS);

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = setTimeout(() => {
    toastNode.classList.remove(TOAST_VISIBLE_CLASS);
    toastTimer = null;
  }, TOAST_HIDE_DELAY_MS);
}

function applyHideSelectors(selectors) {
  const styleNode = ensureHideStyleNode();

  if (!Array.isArray(selectors) || selectors.length === 0) {
    styleNode.textContent = "";
    return;
  }

  const rules = selectors
    .map((selector) => String(selector || "").trim())
    .filter(Boolean)
    .map(
      (selector) =>
        `${selector} { display: none !important; visibility: hidden !important; pointer-events: none !important; }`
    );

  styleNode.textContent = rules.join("\n");
}

async function refreshManualHideRules() {
  const pageUrl = window.location.href;

  if (!/^https?:/i.test(pageUrl)) {
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: "GET_MANUAL_HIDE_RULES_FOR_PAGE",
      pageUrl
    });

    if (!response?.ok) {
      return;
    }

    applyHideSelectors(Array.isArray(response.selectors) ? response.selectors : []);
    lastAppliedPageUrl = pageUrl;
  } catch {
    // Ignore transient worker startup issues.
  }
}

function wireUrlChangeWatcher() {
  setInterval(() => {
    if (window.location.href !== lastAppliedPageUrl) {
      refreshManualHideRules();
    }
  }, 1200);
}

document.addEventListener(
  "contextmenu",
  (event) => {
    rememberContextTarget(event.target);
  },
  {
    capture: true,
    passive: true
  }
);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== "object") {
    return;
  }

  if (message.type === "GET_LAST_CONTEXT_TARGET") {
    sendResponse(
      lastContextTarget || {
        pageUrl: window.location.href,
        selector: "",
        urls: [],
        capturedAt: Date.now()
      }
    );
    return;
  }

  if (message.type === "MANUAL_HIDE_RULES_UPDATED") {
    refreshManualHideRules();
    sendResponse({ ok: true });
    return;
  }

  if (message.type === "SHOW_MANUAL_BLOCK_TOAST") {
    showActionToast(message.message, message.variant);
    sendResponse({ ok: true });
  }
});

refreshManualHideRules();
wireUrlChangeWatcher();
})();

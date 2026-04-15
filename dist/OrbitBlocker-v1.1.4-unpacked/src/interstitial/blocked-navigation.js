const blockedUrlValue = document.getElementById("blockedUrlValue");
const targetUrlValue = document.getElementById("targetUrlValue");
const sourceUrlValue = document.getElementById("sourceUrlValue");
const reasonText = document.getElementById("reasonText");
const statusText = document.getElementById("statusText");
const goBackButton = document.getElementById("goBackButton");
const proceedButton = document.getElementById("proceedButton");
const trustSiteButton = document.getElementById("trustSiteButton");

function parseHttpUrl(rawUrl, baseUrl = undefined) {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    return null;
  }

  try {
    const parsed = baseUrl ? new URL(rawUrl, baseUrl) : new URL(rawUrl);

    if (!/^https?:$/i.test(parsed.protocol)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.style.color = isError ? "#ffd0d0" : "#9fcbff";
}

function setButtonsDisabled(disabled) {
  proceedButton.disabled = disabled;
  goBackButton.disabled = disabled;
  trustSiteButton.disabled = disabled;
}

function describeReason(reason) {
  switch (reason) {
    case "blocked-host":
      return "Reason: known ad or redirect domain";
    case "redirect-trap":
      return "Reason: hidden cross-site redirect pattern";
    case "blocked-by-rule":
      return "Reason: matched extension blocking rule";
    default:
      return "Reason: suspicious redirect pattern";
  }
}

const params = new URLSearchParams(window.location.search);
const blockedUrl = parseHttpUrl(params.get("blocked") || "");
const targetUrl = parseHttpUrl(params.get("target") || "", blockedUrl?.href || undefined) || blockedUrl;
const sourceUrl = parseHttpUrl(params.get("source") || "");
const reason = String(params.get("reason") || "").trim();

reasonText.textContent = describeReason(reason);
blockedUrlValue.textContent = blockedUrl ? blockedUrl.href : "Unavailable";
targetUrlValue.textContent = targetUrl ? targetUrl.href : "Unavailable";
sourceUrlValue.textContent = sourceUrl ? sourceUrl.href : "Unavailable";

async function proceedToDestination() {
  if (!targetUrl) {
    setStatus("Destination URL is unavailable.", true);
    return;
  }

  setButtonsDisabled(true);
  setStatus("Opening destination...");

  try {
    const response = await chrome.runtime.sendMessage({
      type: "NAVIGATE_BLOCKED_TARGET",
      blockedUrl: blockedUrl ? blockedUrl.href : "",
      targetUrl: targetUrl.href,
      sourceUrl: sourceUrl ? sourceUrl.href : ""
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Unable to continue navigation");
    }
  } catch {
    window.location.href = targetUrl.href;
  }
}

async function trustAndProceed() {
  if (!targetUrl) {
    setStatus("Destination URL is unavailable.", true);
    return;
  }

  setButtonsDisabled(true);
  setStatus("Saving site and opening...");

  try {
    const response = await chrome.runtime.sendMessage({
      type: "TRUST_BLOCKED_TARGET_AND_PROCEED",
      blockedUrl: blockedUrl ? blockedUrl.href : "",
      targetUrl: targetUrl.href,
      sourceUrl: sourceUrl ? sourceUrl.href : "",
      reason
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Unable to save trust rule");
    }
  } catch {
    proceedToDestination().catch(() => {
      setStatus("Unable to continue navigation.", true);
      setButtonsDisabled(false);
    });
  }
}

function goBack() {
  setButtonsDisabled(true);

  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  if (sourceUrl) {
    window.location.href = sourceUrl.href;
    return;
  }

  window.close();
  setStatus("No previous page found.", true);
  setButtonsDisabled(false);
}

proceedButton.addEventListener("click", () => {
  proceedToDestination().catch(() => {
    setStatus("Unable to continue navigation.", true);
    setButtonsDisabled(false);
  });
});

goBackButton.addEventListener("click", () => {
  goBack();
});

trustSiteButton.addEventListener("click", () => {
  trustAndProceed().catch(() => {
    setStatus("Unable to save trust rule.", true);
    setButtonsDisabled(false);
  });
});

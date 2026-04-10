const DEFAULT_SETTINGS = Object.freeze({
  blockYoutubeNetworkEnabled: true,
  blockGlobalTrackersEnabled: true,
  blockGlobalAdsEnabled: true,
  blockOemGoogleTrackingEnabled: true,
  blockAutoLearningEnabled: true,
  adaptiveAllowlistHosts: [],
  adaptiveDenylistHosts: [],
  blockRedirectPopupsEnabled: true,
  blockFlashBannersEnabled: true,
  cleanupUiAdsEnabled: true
});

const coreShieldToggle = document.getElementById("coreShieldToggle");
const youtubeShieldToggle = document.getElementById("youtubeShieldToggle");
const oemGoogleShieldToggle = document.getElementById("oemGoogleShieldToggle");
const visualShieldToggle = document.getElementById("visualShieldToggle");
const adaptiveShieldToggle = document.getElementById("adaptiveShieldToggle");
const openDiagnosticsButton = document.getElementById("openDiagnosticsButton");
const openOptionsButton = document.getElementById("openOptionsButton");
const statusText = document.getElementById("statusText");

const TOGGLE_GROUPS = Object.freeze([
  {
    element: coreShieldToggle,
    keys: [
      "blockGlobalTrackersEnabled",
      "blockGlobalAdsEnabled",
      "blockRedirectPopupsEnabled"
    ]
  },
  {
    element: youtubeShieldToggle,
    keys: ["blockYoutubeNetworkEnabled", "cleanupUiAdsEnabled"]
  },
  {
    element: oemGoogleShieldToggle,
    keys: ["blockOemGoogleTrackingEnabled"]
  },
  {
    element: visualShieldToggle,
    keys: ["blockFlashBannersEnabled", "blockRedirectPopupsEnabled"]
  },
  {
    element: adaptiveShieldToggle,
    keys: ["blockAutoLearningEnabled"]
  }
]);

let statusTimer = null;

function getDefaultHintText() {
  const isCompact = window.matchMedia("(max-width: 520px)").matches;
  return isCompact
    ? "Simple mode: shields cover web ads, YouTube, telemetry, visual traps, and adaptive learning."
    : "Use right-click on page content to block specific ads or popups.";
}

function setHintText(message, isError = false) {
  statusText.textContent = message;
  statusText.style.color = isError ? "#b42318" : "#4f6279";

  if (statusTimer) {
    clearTimeout(statusTimer);
  }

  statusTimer = setTimeout(() => {
    statusText.textContent = getDefaultHintText();
    statusText.style.color = "#4f6279";
    statusTimer = null;
  }, 1500);
}

async function openExtensionPage(relativePath) {
  const url = chrome.runtime.getURL(relativePath);

  if (chrome.tabs?.create) {
    try {
      await chrome.tabs.create({ url });
      return;
    } catch {
      // Fallback below for limited mobile contexts.
    }
  }

  window.location.href = url;
}

async function loadSettings() {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);

  for (const group of TOGGLE_GROUPS) {
    if (!group.element) {
      continue;
    }

    group.element.checked = group.keys.every((key) => Boolean(settings[key]));
  }
}

function wireToggleGroup(element, keys) {
  if (!element) {
    return;
  }

  element.addEventListener("change", async () => {
    const nextValue = element.checked;
    const nextSettings = {};

    for (const key of keys) {
      nextSettings[key] = nextValue;
    }

    try {
      await chrome.storage.sync.set(nextSettings);
      await loadSettings();
      setHintText("Setting saved");
    } catch {
      setHintText("Unable to save setting", true);
    }
  });
}

for (const group of TOGGLE_GROUPS) {
  wireToggleGroup(group.element, group.keys);
}

openDiagnosticsButton.addEventListener("click", () => {
  openExtensionPage("src/diagnostics/diagnostics.html");
});

openOptionsButton.addEventListener("click", () => {
  chrome.runtime
    .openOptionsPage()
    .catch(() => openExtensionPage("src/options/options.html"));
});

window.addEventListener("resize", () => {
  if (!statusTimer) {
    statusText.textContent = getDefaultHintText();
  }
});

statusText.textContent = getDefaultHintText();
loadSettings();
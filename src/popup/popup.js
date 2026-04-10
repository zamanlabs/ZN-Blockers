const DEFAULT_SETTINGS = Object.freeze({
  blockYoutubeNetworkEnabled: true,
  youtubePlaybackCompatibilityEnabled: true,
  blockFacebookShieldEnabled: true,
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

const BOOLEAN_SETTING_KEYS = Object.freeze([
  "blockYoutubeNetworkEnabled",
  "youtubePlaybackCompatibilityEnabled",
  "blockFacebookShieldEnabled",
  "blockGlobalTrackersEnabled",
  "blockGlobalAdsEnabled",
  "blockOemGoogleTrackingEnabled",
  "blockAutoLearningEnabled",
  "blockRedirectPopupsEnabled",
  "blockFlashBannersEnabled",
  "cleanupUiAdsEnabled"
]);

const FEATURE_TOGGLE_CONFIG = Object.freeze([
  {
    id: "globalTrackerToggle",
    key: "blockGlobalTrackersEnabled",
    label: "Global tracker filters"
  },
  {
    id: "globalAdsToggle",
    key: "blockGlobalAdsEnabled",
    label: "Global ad filters"
  },
  {
    id: "youtubeNetworkToggle",
    key: "blockYoutubeNetworkEnabled",
    label: "YouTube network shield"
  },
  {
    id: "youtubeCleanupToggle",
    key: "cleanupUiAdsEnabled",
    label: "YouTube UI cleanup"
  },
  {
    id: "youtubePlaybackCompatibilityToggle",
    key: "youtubePlaybackCompatibilityEnabled",
    label: "YouTube playback compatibility"
  },
  {
    id: "facebookShieldToggle",
    key: "blockFacebookShieldEnabled",
    label: "Facebook sponsored shield"
  },
  {
    id: "oemGoogleShieldToggle",
    key: "blockOemGoogleTrackingEnabled",
    label: "OEM and Google telemetry shield"
  },
  {
    id: "redirectPopupToggle",
    key: "blockRedirectPopupsEnabled",
    label: "Redirect popup shield"
  },
  {
    id: "flashBannerToggle",
    key: "blockFlashBannersEnabled",
    label: "Flash and banner visual shield"
  },
  {
    id: "adaptiveShieldToggle",
    key: "blockAutoLearningEnabled",
    label: "Adaptive learning shield"
  }
]);

const masterPowerButton = document.getElementById("masterPowerButton");
const masterPowerLabel = document.getElementById("masterPowerLabel");
const masterStateText = document.getElementById("masterStateText");
const powerCore = document.getElementById("powerCore");
const statusPill = document.getElementById("statusPill");
const openSupportButton = document.getElementById("openSupportButton");
const supportModal = document.getElementById("supportModal");
const supportModalBackdrop = document.getElementById("supportModalBackdrop");
const closeSupportModalButton = document.getElementById("closeSupportModalButton");
const openDiagnosticsButton = document.getElementById("openDiagnosticsButton");
const openOptionsButton = document.getElementById("openOptionsButton");
const statusText = document.getElementById("statusText");

const featureToggles = FEATURE_TOGGLE_CONFIG.map((feature) => ({
  ...feature,
  element: document.getElementById(feature.id)
}));

let statusTimer = null;
let currentSettings = { ...DEFAULT_SETTINGS };

function getDefaultHintText() {
  return "Press the center button to start or stop every shield instantly.";
}

function setHintText(message, isError = false) {
  statusText.textContent = message;
  statusText.style.color = isError ? "#ff9fa5" : "#a8bfdc";

  if (statusTimer) {
    clearTimeout(statusTimer);
  }

  statusTimer = setTimeout(() => {
    statusText.textContent = getDefaultHintText();
    statusText.style.color = "#a8bfdc";
    statusTimer = null;
  }, 1800);
}

function isAllEnabled(settings) {
  return BOOLEAN_SETTING_KEYS.every((key) => Boolean(settings[key]));
}

function animatePowerStart() {
  if (!powerCore) {
    return;
  }

  powerCore.classList.remove("is-starting");
  void powerCore.offsetWidth;
  powerCore.classList.add("is-starting");

  setTimeout(() => {
    powerCore.classList.remove("is-starting");
  }, 1100);
}

function renderMasterState(settings) {
  const allOn = isAllEnabled(settings);

  masterPowerButton.classList.toggle("is-on", allOn);
  masterPowerButton.classList.toggle("is-off", !allOn);
  masterPowerButton.setAttribute("aria-pressed", String(allOn));
  masterPowerLabel.textContent = allOn ? "ON" : "OFF";
  masterStateText.textContent = allOn
    ? "All filters and features are active."
    : "All shields are currently off.";

  statusPill.textContent = allOn ? "All ON" : "All OFF";
  statusPill.classList.toggle("on", allOn);
}

function renderFeatureToggles(settings) {
  for (const feature of featureToggles) {
    if (!feature.element) {
      continue;
    }

    feature.element.checked = Boolean(settings[feature.key]);
  }
}

function render(settings) {
  currentSettings = settings;
  renderMasterState(settings);
  renderFeatureToggles(settings);
}

function createBooleanSettingsUpdate(value) {
  const update = {};

  for (const key of BOOLEAN_SETTING_KEYS) {
    update[key] = value;
  }

  return update;
}

async function loadSettings() {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  render(settings);
  return settings;
}

async function saveAndRefresh(nextSettings) {
  await chrome.storage.sync.set(nextSettings);
  return loadSettings();
}

async function openExtensionPage(relativePath) {
  const url = chrome.runtime.getURL(relativePath);

  if (chrome.tabs?.create) {
    try {
      await chrome.tabs.create({ url });
      return;
    } catch {
      // Fallback below for limited contexts.
    }
  }

  window.location.href = url;
}

function closeSupportModal(returnFocus = true) {
  if (!supportModal) {
    return;
  }

  supportModal.hidden = true;
  document.body.classList.remove("modal-open");

  if (returnFocus && openSupportButton) {
    openSupportButton.focus();
  }
}

function openSupportModal() {
  if (!supportModal) {
    return;
  }

  supportModal.hidden = false;
  document.body.classList.add("modal-open");

  if (closeSupportModalButton) {
    closeSupportModalButton.focus();
  }

  setHintText("bKash Send Money");
}

masterPowerButton.addEventListener("click", async () => {
  const targetEnabledState = !isAllEnabled(currentSettings);

  if (targetEnabledState) {
    animatePowerStart();
  }

  masterPowerButton.disabled = true;

  try {
    await saveAndRefresh(createBooleanSettingsUpdate(targetEnabledState));
    setHintText(targetEnabledState ? "All shields enabled" : "All shields disabled");
  } catch {
    setHintText("Unable to update master shield state", true);
  } finally {
    setTimeout(
      () => {
        masterPowerButton.disabled = false;
      },
      targetEnabledState ? 600 : 0
    );
  }
});

for (const feature of featureToggles) {
  if (!feature.element) {
    continue;
  }

  feature.element.addEventListener("change", async () => {
    try {
      await saveAndRefresh({
        [feature.key]: feature.element.checked
      });

      setHintText(`${feature.label} ${feature.element.checked ? "enabled" : "disabled"}`);
    } catch {
      setHintText("Unable to save setting", true);
    }
  });
}

if (openSupportButton) {
  openSupportButton.addEventListener("click", () => {
    openSupportModal();
  });
}

if (closeSupportModalButton) {
  closeSupportModalButton.addEventListener("click", () => {
    closeSupportModal();
  });
}

if (supportModalBackdrop) {
  supportModalBackdrop.addEventListener("click", () => {
    closeSupportModal();
  });
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && supportModal && !supportModal.hidden) {
    closeSupportModal();
  }
});

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
loadSettings().catch(() => {
  setHintText("Unable to load extension settings", true);
});
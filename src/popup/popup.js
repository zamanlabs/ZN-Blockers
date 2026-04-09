const DEFAULT_SETTINGS = Object.freeze({
  blockYoutubeNetworkEnabled: true,
  blockGlobalTrackersEnabled: true,
  blockGlobalAdsEnabled: true,
  blockRedirectPopupsEnabled: true,
  blockFlashBannersEnabled: true,
  cleanupUiAdsEnabled: true
});

const blockGlobalTrackersToggle = document.getElementById("blockGlobalTrackersToggle");
const blockYoutubeNetworkToggle = document.getElementById("blockYoutubeNetworkToggle");
const blockGlobalAdsToggle = document.getElementById("blockGlobalAdsToggle");
const blockFlashBannersToggle = document.getElementById("blockFlashBannersToggle");
const blockRedirectPopupsToggle = document.getElementById("blockRedirectPopupsToggle");
const cleanupUiAdsToggle = document.getElementById("cleanupUiAdsToggle");
const openDiagnosticsButton = document.getElementById("openDiagnosticsButton");
const openOptionsButton = document.getElementById("openOptionsButton");
const statusText = document.getElementById("statusText");

let statusTimer = null;

function getDefaultHintText() {
  const isCompact = window.matchMedia("(max-width: 520px)").matches;
  return isCompact
    ? "Edge Canary mobile mode: touch-ready controls with adaptive layout."
    : "Reload active tabs after major setting changes for immediate effect.";
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

  blockGlobalTrackersToggle.checked = Boolean(settings.blockGlobalTrackersEnabled);
  blockYoutubeNetworkToggle.checked = Boolean(settings.blockYoutubeNetworkEnabled);
  blockGlobalAdsToggle.checked = Boolean(settings.blockGlobalAdsEnabled);
  blockFlashBannersToggle.checked = Boolean(settings.blockFlashBannersEnabled);
  blockRedirectPopupsToggle.checked = Boolean(settings.blockRedirectPopupsEnabled);
  cleanupUiAdsToggle.checked = Boolean(settings.cleanupUiAdsEnabled);
}

function wireToggle(element, key) {
  element.addEventListener("change", async () => {
    try {
      await chrome.storage.sync.set({
        [key]: element.checked
      });
      setHintText("Setting saved");
    } catch {
      setHintText("Unable to save setting", true);
    }
  });
}

wireToggle(blockGlobalTrackersToggle, "blockGlobalTrackersEnabled");
wireToggle(blockYoutubeNetworkToggle, "blockYoutubeNetworkEnabled");
wireToggle(blockGlobalAdsToggle, "blockGlobalAdsEnabled");
wireToggle(blockFlashBannersToggle, "blockFlashBannersEnabled");
wireToggle(blockRedirectPopupsToggle, "blockRedirectPopupsEnabled");
wireToggle(cleanupUiAdsToggle, "cleanupUiAdsEnabled");

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
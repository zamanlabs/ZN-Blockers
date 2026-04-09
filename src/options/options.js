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
const mobileModeText = document.getElementById("mobileModeText");
const statusText = document.getElementById("statusText");

let statusTimer = null;

function showStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.style.color = isError ? "#b42318" : "#1b7d72";

  if (statusTimer) {
    clearTimeout(statusTimer);
  }

  statusTimer = setTimeout(() => {
    statusText.textContent = "";
    statusText.style.color = "#1b7d72";
    statusTimer = null;
  }, 1400);
}

function updateMobileModeText() {
  const isMobileLayout = window.matchMedia("(max-width: 760px)").matches;

  mobileModeText.textContent = isMobileLayout
    ? "Mobile layout active: compact cards and larger touch controls are enabled."
    : "Desktop layout active: full feature cards and expanded settings detail are enabled.";
}

async function openDiagnosticsPage() {
  const diagnosticsUrl = chrome.runtime.getURL("src/diagnostics/diagnostics.html");

  if (chrome.tabs?.create) {
    try {
      await chrome.tabs.create({ url: diagnosticsUrl });
      return;
    } catch {
      // Fallback below for limited mobile contexts.
    }
  }

  window.location.href = diagnosticsUrl;
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

function wireSetting(toggle, settingKey) {
  toggle.addEventListener("change", async () => {
    try {
      await chrome.storage.sync.set({
        [settingKey]: toggle.checked
      });

      showStatus("Settings saved");
    } catch {
      showStatus("Unable to save settings", true);
    }
  });
}

wireSetting(blockGlobalTrackersToggle, "blockGlobalTrackersEnabled");
wireSetting(blockYoutubeNetworkToggle, "blockYoutubeNetworkEnabled");
wireSetting(blockGlobalAdsToggle, "blockGlobalAdsEnabled");
wireSetting(blockFlashBannersToggle, "blockFlashBannersEnabled");
wireSetting(blockRedirectPopupsToggle, "blockRedirectPopupsEnabled");
wireSetting(cleanupUiAdsToggle, "cleanupUiAdsEnabled");

openDiagnosticsButton.addEventListener("click", () => {
  openDiagnosticsPage();
});

window.addEventListener("resize", updateMobileModeText);

updateMobileModeText();
loadSettings();
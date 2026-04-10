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

const ADAPTIVE_REFRESH_INTERVAL_MS = 7000;

const coreShieldToggle = document.getElementById("coreShieldToggle");
const youtubeShieldToggle = document.getElementById("youtubeShieldToggle");
const oemGoogleShieldToggle = document.getElementById("oemGoogleShieldToggle");
const visualShieldToggle = document.getElementById("visualShieldToggle");
const adaptiveShieldToggle = document.getElementById("adaptiveShieldToggle");
const openDiagnosticsButton = document.getElementById("openDiagnosticsButton");
const adaptiveTrackedValue = document.getElementById("adaptiveTrackedValue");
const adaptivePromotedValue = document.getElementById("adaptivePromotedValue");
const adaptiveReadyValue = document.getElementById("adaptiveReadyValue");
const adaptiveManualValue = document.getElementById("adaptiveManualValue");
const adaptiveStatusText = document.getElementById("adaptiveStatusText");
const allowHostInput = document.getElementById("allowHostInput");
const addAllowHostButton = document.getElementById("addAllowHostButton");
const allowHostList = document.getElementById("allowHostList");
const denyHostInput = document.getElementById("denyHostInput");
const addDenyHostButton = document.getElementById("addDenyHostButton");
const denyHostList = document.getElementById("denyHostList");
const mobileModeText = document.getElementById("mobileModeText");
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
let adaptiveRefreshTimer = null;
let allowlistHosts = [];
let denylistHosts = [];

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

function normalizeHostValue(rawValue) {
  if (typeof rawValue !== "string") {
    return "";
  }

  const trimmed = rawValue.trim().toLowerCase();

  if (!trimmed) {
    return "";
  }

  let candidate = trimmed.replace(/^https?:\/\//, "").replace(/^www\./, "");
  candidate = candidate.split(/[/?#]/)[0].replace(/:\d+$/, "").replace(/\.$/, "");

  if (!/^[a-z0-9.-]+$/i.test(candidate)) {
    return "";
  }

  return candidate;
}

function normalizeHostArray(rawHosts) {
  if (!Array.isArray(rawHosts)) {
    return [];
  }

  const seen = new Set();
  const next = [];

  for (const rawHost of rawHosts) {
    const normalized = normalizeHostValue(rawHost);

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    next.push(normalized);
  }

  return next;
}

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

function renderHostList(container, hosts, listType) {
  container.innerHTML = "";

  if (hosts.length === 0) {
    const empty = document.createElement("li");
    empty.className = "host-empty";
    empty.textContent = "No hosts added";
    container.appendChild(empty);
    return;
  }

  for (const host of hosts) {
    const item = document.createElement("li");
    item.className = "host-item";

    const label = document.createElement("span");
    label.textContent = host;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      removeHost(listType, host);
    });

    item.append(label, removeButton);
    container.appendChild(item);
  }
}

function renderHostLists() {
  renderHostList(allowHostList, allowlistHosts, "allow");
  renderHostList(denyHostList, denylistHosts, "deny");
}

function renderAdaptiveSummary(summary) {
  adaptiveTrackedValue.textContent = formatNumber(summary.trackedCandidates);
  adaptivePromotedValue.textContent = formatNumber(summary.promotedRules);
  adaptiveReadyValue.textContent = formatNumber(summary.promotionReady);
  adaptiveManualValue.textContent = formatNumber(summary.manualBlockedHosts);

  const allowCount = Array.isArray(summary.allowlistHosts)
    ? summary.allowlistHosts.length
    : allowlistHosts.length;
  const denyCount = Array.isArray(summary.denylistHosts)
    ? summary.denylistHosts.length
    : denylistHosts.length;

  adaptiveStatusText.textContent = `Allow list: ${formatNumber(allowCount)} | Deny list: ${formatNumber(
    denyCount
  )} | Manual hide selectors: ${formatNumber(summary.manualHideSelectors)}`;
}

async function refreshAdaptiveSummary(showMessage = false) {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "GET_AUTO_LEARNING_SUMMARY"
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Adaptive summary request failed");
    }

    renderAdaptiveSummary(response.summary || {});

    if (showMessage) {
      showStatus("Adaptive diagnostics refreshed");
    }
  } catch (error) {
    adaptiveStatusText.textContent = "Adaptive diagnostics unavailable";

    if (showMessage) {
      showStatus(error.message || String(error), true);
    }
  }
}

async function saveHostLists() {
  await chrome.storage.sync.set({
    adaptiveAllowlistHosts: allowlistHosts,
    adaptiveDenylistHosts: denylistHosts
  });
}

async function addHost(listType) {
  const input = listType === "allow" ? allowHostInput : denyHostInput;
  const normalizedHost = normalizeHostValue(input.value);

  if (!normalizedHost) {
    showStatus("Enter a valid host", true);
    return;
  }

  const list = listType === "allow" ? allowlistHosts : denylistHosts;

  if (list.includes(normalizedHost)) {
    showStatus("Host already listed", true);
    return;
  }

  list.push(normalizedHost);
  list.sort();

  try {
    await saveHostLists();
    renderHostLists();
    await refreshAdaptiveSummary(false);
    input.value = "";
    showStatus("Host added");
  } catch {
    showStatus("Unable to save host list", true);
  }
}

async function removeHost(listType, host) {
  const list = listType === "allow" ? allowlistHosts : denylistHosts;
  const next = list.filter((entry) => entry !== host);

  if (listType === "allow") {
    allowlistHosts = next;
  } else {
    denylistHosts = next;
  }

  try {
    await saveHostLists();
    renderHostLists();
    await refreshAdaptiveSummary(false);
    showStatus("Host removed");
  } catch {
    showStatus("Unable to update host list", true);
  }
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

  allowlistHosts = normalizeHostArray(settings.adaptiveAllowlistHosts);
  denylistHosts = normalizeHostArray(settings.adaptiveDenylistHosts);
  renderHostLists();

  for (const group of TOGGLE_GROUPS) {
    if (!group.element) {
      continue;
    }

    group.element.checked = group.keys.every((key) => Boolean(settings[key]));
  }
}

function wireSettingGroup(toggle, settingKeys) {
  if (!toggle) {
    return;
  }

  toggle.addEventListener("change", async () => {
    const nextValue = toggle.checked;
    const nextSettings = {};

    for (const key of settingKeys) {
      nextSettings[key] = nextValue;
    }

    try {
      await chrome.storage.sync.set(nextSettings);
      await loadSettings();

      showStatus("Settings saved");
    } catch {
      showStatus("Unable to save settings", true);
    }
  });
}

for (const group of TOGGLE_GROUPS) {
  wireSettingGroup(group.element, group.keys);
}

addAllowHostButton.addEventListener("click", () => {
  addHost("allow");
});

allowHostInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addHost("allow");
  }
});

addDenyHostButton.addEventListener("click", () => {
  addHost("deny");
});

denyHostInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addHost("deny");
  }
});

openDiagnosticsButton.addEventListener("click", () => {
  openDiagnosticsPage();
});

window.addEventListener("resize", updateMobileModeText);

updateMobileModeText();
loadSettings();
refreshAdaptiveSummary(false);

adaptiveRefreshTimer = setInterval(() => {
  refreshAdaptiveSummary(false);
}, ADAPTIVE_REFRESH_INTERVAL_MS);

window.addEventListener("beforeunload", () => {
  if (adaptiveRefreshTimer) {
    clearInterval(adaptiveRefreshTimer);
    adaptiveRefreshTimer = null;
  }

  if (statusTimer) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }
});
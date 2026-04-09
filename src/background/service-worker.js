const DEFAULT_SETTINGS = Object.freeze({
  blockYoutubeNetworkEnabled: true,
  blockGlobalTrackersEnabled: true,
  blockGlobalAdsEnabled: true,
  blockRedirectPopupsEnabled: true,
  blockFlashBannersEnabled: true,
  cleanupUiAdsEnabled: true
});

const LEGACY_SETTING_KEY_MAP = Object.freeze({
  blockTrackersEnabled: "blockYoutubeNetworkEnabled"
});

const RULESETS_BY_SETTING = Object.freeze({
  blockYoutubeNetworkEnabled: ["youtube_core"],
  blockGlobalTrackersEnabled: ["easyprivacy_global"],
  blockGlobalAdsEnabled: ["easylist_global_ads", "adguard_base_ads"],
  blockRedirectPopupsEnabled: ["popup_redirect_shield"]
});

const RULESET_LABELS = Object.freeze({
  youtube_core: "YouTube Core",
  easyprivacy_global: "EasyPrivacy Global",
  easylist_global_ads: "EasyList Global Ads",
  adguard_base_ads: "AdGuard Base Ads",
  popup_redirect_shield: "Popup Redirect Shield"
});

const RULESET_IDS = Object.freeze(
  [...new Set(Object.values(RULESETS_BY_SETTING).flat())]
);
const RULE_CONTROL_KEYS = new Set(Object.keys(RULESETS_BY_SETTING));

const DIAGNOSTICS_STORAGE_KEY = "diagnosticsState";
const DIAGNOSTICS_FLUSH_DELAY_MS = 1500;
const RECENT_MATCH_LOOKBACK_MS = 24 * 60 * 60 * 1000;

let diagnosticsStatePromise = null;
let diagnosticsFlushTimer = null;
let staticRuleCountPromise = null;
let diagnosticsListenerStatus = {
  attached: false,
  available: false,
  error: ""
};

function toMessageError(error) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function toNonNegativeInteger(value, fallback = 0) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric < 0) {
    return fallback;
  }

  return Math.floor(numeric);
}

function createEmptyRulesetCounter() {
  const next = {};

  for (const rulesetId of RULESET_IDS) {
    next[rulesetId] = 0;
  }

  return next;
}

function createDiagnosticsState() {
  return {
    startedAt: Date.now(),
    updatedAt: null,
    totalBlockedRequests: 0,
    blockedByRuleset: createEmptyRulesetCounter(),
    blockedByUnknownRuleset: 0
  };
}

function normalizeDiagnosticsState(rawValue) {
  const fallback = createDiagnosticsState();

  if (!rawValue || typeof rawValue !== "object") {
    return fallback;
  }

  const normalized = {
    startedAt: toNonNegativeInteger(rawValue.startedAt, fallback.startedAt),
    updatedAt:
      typeof rawValue.updatedAt === "number"
        ? toNonNegativeInteger(rawValue.updatedAt, null)
        : null,
    totalBlockedRequests: toNonNegativeInteger(rawValue.totalBlockedRequests, 0),
    blockedByRuleset: createEmptyRulesetCounter(),
    blockedByUnknownRuleset: toNonNegativeInteger(rawValue.blockedByUnknownRuleset, 0)
  };

  if (rawValue.blockedByRuleset && typeof rawValue.blockedByRuleset === "object") {
    for (const rulesetId of RULESET_IDS) {
      normalized.blockedByRuleset[rulesetId] = toNonNegativeInteger(
        rawValue.blockedByRuleset[rulesetId],
        0
      );
    }
  }

  return normalized;
}

async function getDiagnosticsState() {
  if (!diagnosticsStatePromise) {
    diagnosticsStatePromise = chrome.storage.local
      .get([DIAGNOSTICS_STORAGE_KEY])
      .then((stored) => normalizeDiagnosticsState(stored[DIAGNOSTICS_STORAGE_KEY]));
  }

  return diagnosticsStatePromise;
}

async function persistDiagnosticsState() {
  const state = await getDiagnosticsState();
  await chrome.storage.local.set({
    [DIAGNOSTICS_STORAGE_KEY]: state
  });
}

function scheduleDiagnosticsPersist() {
  if (diagnosticsFlushTimer) {
    return;
  }

  diagnosticsFlushTimer = setTimeout(() => {
    diagnosticsFlushTimer = null;

    persistDiagnosticsState().catch((error) => {
      console.error("Failed to persist diagnostics state", error);
    });
  }, DIAGNOSTICS_FLUSH_DELAY_MS);
}

function resolveRulesetId(matchInfo) {
  const rulesetId = matchInfo?.rule?.rulesetId;

  if (typeof rulesetId === "string" && rulesetId.length > 0) {
    return rulesetId;
  }

  return "unknown";
}

async function recordBlockedRequest(matchInfo) {
  const state = await getDiagnosticsState();
  const rulesetId = resolveRulesetId(matchInfo);

  state.totalBlockedRequests += 1;
  state.updatedAt = Date.now();

  if (Object.hasOwn(state.blockedByRuleset, rulesetId)) {
    state.blockedByRuleset[rulesetId] += 1;
  } else {
    state.blockedByUnknownRuleset += 1;
  }

  scheduleDiagnosticsPersist();
}

function ensureDiagnosticsListenerAttached() {
  if (diagnosticsListenerStatus.attached) {
    return;
  }

  const debugListener = chrome.declarativeNetRequest?.onRuleMatchedDebug;

  if (!debugListener || typeof debugListener.addListener !== "function") {
    diagnosticsListenerStatus = {
      attached: false,
      available: false,
      error: "Matched-rule debug listener is not exposed by this browser build."
    };
    return;
  }

  try {
    debugListener.addListener((matchInfo) => {
      recordBlockedRequest(matchInfo).catch((error) => {
        console.error("Failed to process matched-rule event", error);
      });
    });

    diagnosticsListenerStatus = {
      attached: true,
      available: true,
      error: ""
    };
  } catch (error) {
    diagnosticsListenerStatus = {
      attached: false,
      available: false,
      error: toMessageError(error)
    };
  }
}

async function initializeDiagnostics() {
  await getDiagnosticsState();
  ensureDiagnosticsListenerAttached();
}

async function readJsonFromRuntime(relativePath) {
  const response = await fetch(chrome.runtime.getURL(relativePath), {
    cache: "no-cache"
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${relativePath}: ${response.status}`);
  }

  return response.json();
}

async function loadStaticRuleCounts() {
  if (!staticRuleCountPromise) {
    staticRuleCountPromise = (async () => {
      const counts = {};

      try {
        const youtubeCore = await readJsonFromRuntime("rules/youtube-core.json");
        counts.youtube_core = Array.isArray(youtubeCore) ? youtubeCore.length : null;
      } catch {
        counts.youtube_core = null;
      }

      try {
        const easyPrivacyMeta = await readJsonFromRuntime("rules/easyprivacy-global.meta.json");
        counts.easyprivacy_global = toNonNegativeInteger(
          easyPrivacyMeta.generatedRules,
          null
        );
      } catch {
        counts.easyprivacy_global = null;
      }

      try {
        const easyListMeta = await readJsonFromRuntime("rules/easylist-global.meta.json");
        counts.easylist_global_ads = toNonNegativeInteger(easyListMeta.generatedRules, null);
      } catch {
        counts.easylist_global_ads = null;
      }

      try {
        const adGuardBaseMeta = await readJsonFromRuntime("rules/adguard-base-global.meta.json");
        counts.adguard_base_ads = toNonNegativeInteger(adGuardBaseMeta.generatedRules, null);
      } catch {
        counts.adguard_base_ads = null;
      }

      try {
        const popupRedirectShield = await readJsonFromRuntime(
          "rules/popup-redirect-shield.json"
        );
        counts.popup_redirect_shield = Array.isArray(popupRedirectShield)
          ? popupRedirectShield.length
          : null;
      } catch {
        counts.popup_redirect_shield = null;
      }

      return counts;
    })();
  }

  const counts = await staticRuleCountPromise;
  return {
    ...counts
  };
}

async function getRecentMatchedRulesSummary() {
  const summary = {
    available: false,
    windowMs: RECENT_MATCH_LOOKBACK_MS,
    total: 0,
    byRuleset: {},
    error: ""
  };

  if (typeof chrome.declarativeNetRequest.getMatchedRules !== "function") {
    summary.error = "Matched-rule query API is not available in this browser build.";
    return summary;
  }

  try {
    const { rulesMatchedInfo = [] } = await chrome.declarativeNetRequest.getMatchedRules({
      minTimeStamp: Date.now() - RECENT_MATCH_LOOKBACK_MS
    });

    for (const info of rulesMatchedInfo) {
      const rulesetId = resolveRulesetId(info);
      summary.byRuleset[rulesetId] = (summary.byRuleset[rulesetId] || 0) + 1;
    }

    summary.available = true;
    summary.total = rulesMatchedInfo.length;
    return summary;
  } catch (error) {
    summary.error = toMessageError(error);
    return summary;
  }
}

async function getEnabledRulesetIds() {
  try {
    return await chrome.declarativeNetRequest.getEnabledRulesets();
  } catch {
    return [];
  }
}

async function buildDiagnosticsSnapshot() {
  await initializeDiagnostics();

  const [settings, enabledRulesetIds, diagnosticsState, staticRuleCounts, recentMatchedRules] =
    await Promise.all([
      getSettings(),
      getEnabledRulesetIds(),
      getDiagnosticsState(),
      loadStaticRuleCounts(),
      getRecentMatchedRulesSummary()
    ]);

  const enabledSet = new Set(enabledRulesetIds);
  const rulesets = RULESET_IDS.map((rulesetId) => ({
    id: rulesetId,
    label: RULESET_LABELS[rulesetId] || rulesetId,
    enabled: enabledSet.has(rulesetId),
    staticRuleCount: staticRuleCounts[rulesetId] ?? null,
    blockedCount: diagnosticsState.blockedByRuleset[rulesetId] || 0
  }));

  return {
    capturedAt: Date.now(),
    settings,
    rulesets,
    totals: {
      totalBlockedRequests: diagnosticsState.totalBlockedRequests,
      blockedByUnknownRuleset: diagnosticsState.blockedByUnknownRuleset,
      startedAt: diagnosticsState.startedAt,
      updatedAt: diagnosticsState.updatedAt
    },
    listener: {
      ...diagnosticsListenerStatus
    },
    recentMatchedRules
  };
}

async function resetDiagnosticsCounters() {
  diagnosticsStatePromise = Promise.resolve(createDiagnosticsState());

  if (diagnosticsFlushTimer) {
    clearTimeout(diagnosticsFlushTimer);
    diagnosticsFlushTimer = null;
  }

  await persistDiagnosticsState();
}

async function getSettings() {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return {
    ...DEFAULT_SETTINGS,
    ...settings
  };
}

async function migrateLegacySettings() {
  const legacyKeys = Object.keys(LEGACY_SETTING_KEY_MAP);
  const legacySettings = await chrome.storage.sync.get(legacyKeys);
  const nextSettings = {};
  const keysToDelete = [];

  for (const [legacyKey, nextKey] of Object.entries(LEGACY_SETTING_KEY_MAP)) {
    if (typeof legacySettings[legacyKey] === "undefined") {
      continue;
    }

    const current = await chrome.storage.sync.get([nextKey]);

    if (typeof current[nextKey] === "undefined") {
      nextSettings[nextKey] = Boolean(legacySettings[legacyKey]);
    }

    keysToDelete.push(legacyKey);
  }

  if (Object.keys(nextSettings).length > 0) {
    await chrome.storage.sync.set(nextSettings);
  }

  if (keysToDelete.length > 0) {
    await chrome.storage.sync.remove(keysToDelete);
  }
}

function getRulesetUpdatePayload(settings) {
  const enableRulesetIds = [];
  const disableRulesetIds = [];

  for (const [settingKey, rulesetIds] of Object.entries(RULESETS_BY_SETTING)) {
    const target = Boolean(settings[settingKey]) ? enableRulesetIds : disableRulesetIds;

    for (const rulesetId of rulesetIds) {
      target.push(rulesetId);
    }
  }

  return {
    enableRulesetIds,
    disableRulesetIds
  };
}

async function updateRulesetState(settings) {
  const { enableRulesetIds, disableRulesetIds } = getRulesetUpdatePayload(settings);

  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds,
    disableRulesetIds
  });
}

async function updateBadgeState(isEnabled) {
  await chrome.action.setBadgeBackgroundColor({
    color: isEnabled ? "#166534" : "#7f1d1d"
  });

  await chrome.action.setBadgeText({
    text: isEnabled ? "ON" : "OFF"
  });
}

async function syncBlockingState() {
  const settings = await getSettings();
  const isAnyBlockingEnabled = Boolean(
    settings.blockYoutubeNetworkEnabled ||
      settings.blockGlobalTrackersEnabled ||
      settings.blockGlobalAdsEnabled ||
      settings.blockRedirectPopupsEnabled
  );

  await updateRulesetState(settings);
  await updateBadgeState(isAnyBlockingEnabled);
}

chrome.runtime.onInstalled.addListener(async () => {
  await migrateLegacySettings();
  await initializeDiagnostics();

  const stored = await chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS));
  const missingDefaults = {};

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (typeof stored[key] === "undefined") {
      missingDefaults[key] = value;
    }
  }

  if (Object.keys(missingDefaults).length > 0) {
    await chrome.storage.sync.set(missingDefaults);
  }

  await syncBlockingState();
});

chrome.runtime.onStartup.addListener(async () => {
  await migrateLegacySettings();
  await initializeDiagnostics();
  await syncBlockingState();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== "object") {
    return;
  }

  if (message.type === "GET_DIAGNOSTICS_SNAPSHOT") {
    (async () => {
      const snapshot = await buildDiagnosticsSnapshot();
      sendResponse({
        ok: true,
        snapshot
      });
    })().catch((error) => {
      sendResponse({
        ok: false,
        error: toMessageError(error)
      });
    });

    return true;
  }

  if (message.type === "RESET_DIAGNOSTICS_COUNTERS") {
    (async () => {
      await resetDiagnosticsCounters();

      const snapshot = await buildDiagnosticsSnapshot();
      sendResponse({
        ok: true,
        snapshot
      });
    })().catch((error) => {
      sendResponse({
        ok: false,
        error: toMessageError(error)
      });
    });

    return true;
  }
});

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName !== "sync") {
    return;
  }

  const changedKeys = Object.keys(changes);
  const hasRuleOrLegacyChange = changedKeys.some(
    (key) => RULE_CONTROL_KEYS.has(key) || Object.hasOwn(LEGACY_SETTING_KEY_MAP, key)
  );

  if (!hasRuleOrLegacyChange) {
    return;
  }

  await migrateLegacySettings();
  await syncBlockingState();
});

initializeDiagnostics().catch((error) => {
  console.warn("Diagnostics initialization failed", error);
});
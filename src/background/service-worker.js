const DEFAULT_SETTINGS = Object.freeze({
  blockYoutubeNetworkEnabled: true,
  youtubePlaybackCompatibilityEnabled: true,
  youtubePreplayCompatibilityEnabled: false,
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

const LEGACY_SETTING_KEY_MAP = Object.freeze({
  blockTrackersEnabled: "blockYoutubeNetworkEnabled"
});

const RULESETS_BY_SETTING = Object.freeze({
  blockYoutubeNetworkEnabled: ["youtube_core"],
  blockFacebookShieldEnabled: ["facebook_tracking_shield"],
  blockGlobalTrackersEnabled: ["easyprivacy_global"],
  blockGlobalAdsEnabled: [
    "easylist_global_ads",
    "adguard_base_ads",
    "provider_hard_shield"
  ],
  blockOemGoogleTrackingEnabled: ["oem_google_tracking_shield"],
  blockRedirectPopupsEnabled: ["popup_redirect_shield"]
});

const RULESET_LABELS = Object.freeze({
  youtube_core: "YouTube Core",
  facebook_tracking_shield: "Facebook Sponsored + Tracking Shield",
  easyprivacy_global: "EasyPrivacy Global",
  easylist_global_ads: "EasyList Global Ads",
  adguard_base_ads: "AdGuard Base Ads",
  provider_hard_shield: "Provider Hard Shield",
  oem_google_tracking_shield: "OEM + Google Tracking Shield",
  popup_redirect_shield: "Popup Redirect Shield"
});

const RULESET_IDS = Object.freeze(
  [...new Set(Object.values(RULESETS_BY_SETTING).flat())]
);
const RULE_CONTROL_KEYS = new Set(Object.keys(RULESETS_BY_SETTING));

const DIAGNOSTICS_STORAGE_KEY = "diagnosticsState";
const DIAGNOSTICS_FLUSH_DELAY_MS = 1500;
const RECENT_MATCH_LOOKBACK_MS = 24 * 60 * 60 * 1000;

const AUTO_LEARN_STORAGE_KEY = "autoLearnState";
const AUTO_LEARN_FLUSH_DELAY_MS = 2000;
const AUTO_LEARN_RULE_ID_START = 200000;
const AUTO_LEARN_MAX_DYNAMIC_RULES = 1200;
const AUTO_LEARN_MAX_CANDIDATES = 2000;
const AUTO_LEARN_MAX_INITIATOR_SITES = 8;
const AUTO_LEARN_MIN_SCORE = 35;
const AUTO_LEARN_PROMOTE_SCORE = 70;
const AUTO_LEARN_PROMOTE_HITS = 4;
const AUTO_LEARN_PROMOTE_SITE_COUNT = 2;
const AUTO_LEARN_DEDUPE_WINDOW_MS = 30000;
const AUTO_LEARN_DEDUPE_CACHE_MAX = 3000;

const CONTEXT_MENU_BLOCK_CONTENT_ID = "zn_block_content";

const MANUAL_BLOCK_STORAGE_KEY = "manualBlockState";
const MANUAL_BLOCK_FLUSH_DELAY_MS = 2000;
const MANUAL_RULE_ID_START = 400000;
const MANUAL_RULE_ID_END = 499999;
const MANUAL_MAX_HOST_RULES = 1000;
const MANUAL_MAX_HIDE_RULES_PER_SITE = 60;
const MANUAL_MAX_HIDE_SITES = 500;

const MANUAL_BLOCK_RESOURCE_TYPES = Object.freeze([
  "main_frame",
  "sub_frame",
  "script",
  "image",
  "stylesheet",
  "xmlhttprequest",
  "media",
  "font",
  "ping",
  "other"
]);

const AUTO_LEARN_TRACKING_HOST_SUFFIXES = Object.freeze([
  "doubleclick.net",
  "googlesyndication.com",
  "googleadservices.com",
  "googleads.g.doubleclick.net",
  "pubads.g.doubleclick.net",
  "securepubads.g.doubleclick.net",
  "partnerad.l.doubleclick.net",
  "ad.doubleclick.net",
  "google-analytics.com",
  "googletagmanager.com",
  "google-analytics.cn",
  "app-measurement.com",
  "adservice.google.com",
  "myadcenter.google.com",
  "adcenter.google.com",
  "pagead2.googlesyndication.com",
  "tpc.googlesyndication.com",
  "analytics.google.com",
  "stats.g.doubleclick.net",
  "analytics.yahoo.com",
  "analytics.twitter.com",
  "analytics.tiktok.com",
  "pixel.facebook.com",
  "connect.facebook.net",
  "ads.facebook.com",
  "adnxs.com",
  "criteo.com",
  "taboola.com",
  "outbrain.com",
  "scorecardresearch.com",
  "quantserve.com",
  "adroll.com",
  "branch.io",
  "adjust.com",
  "tracking.miui.com",
  "tracking.intl.miui.com",
  "api.ad.xiaomi.com",
  "sdkconfig.ad.xiaomi.com",
  "ad.intl.xiaomi.com",
  "adsfs.oppomobile.com",
  "adx.ads.oppomobile.com",
  "adsfs.heytapmobi.com",
  "adx.ads.heytapmobi.com",
  "api.ads.realmemobile.com",
  "adlog.vivo.com.cn",
  "adreq.vivo.com.cn",
  "ads.vivo.com.cn",
  "samsungads.com",
  "samsungacr.com",
  "ads.samsung.com",
  "ads.lenovo.com",
  "adapi.lenovomm.com",
  "ad.huawei.com",
  "browser.events.data.microsoft.com",
  "mobile.events.data.microsoft.com",
  "telemetry.microsoft.com",
  "amazon-adsystem.com",
  "aax.amazon-adsystem.com",
  "c.amazon-adsystem.com",
  "d.amazon-adsystem.com",
  "mads.amazon-adsystem.com",
  "s.amazon-adsystem.com",
  "fls-na.amazon-adsystem.com",
  "aax-us-east.amazon-adsystem.com"
]);

const AUTO_LEARN_HOST_SIGNAL_REGEX =
  /(^|[.-])(ad|ads|adserver|adservice|analytics|track|tracking|trk|telemetry|metrics|pixel|beacon|doubleclick|sponsor)([.-]|$)/i;
const AUTO_LEARN_PATH_SIGNAL_REGEX =
  /(collect|tracking|analytics|telemetry|metrics|beacon|pixel|viewthrough|conversion|adclick|adservice|doubleclick|gtm\.js|gtag\/js|aclk)/i;

const AUTO_LEARN_RESOURCE_TYPES = Object.freeze([
  "script",
  "image",
  "xmlhttprequest",
  "ping",
  "sub_frame",
  "other"
]);

let diagnosticsStatePromise = null;
let diagnosticsFlushTimer = null;
let staticRuleCountPromise = null;
let diagnosticsListenerStatus = {
  attached: false,
  available: false,
  error: ""
};

let autoLearnStatePromise = null;
let autoLearnFlushTimer = null;
let autoLearnMutationQueue = Promise.resolve();
let autoLearnDedupeCache = new Map();
let autoLearnWebRequestListener = null;
let autoLearningEnabled = true;
let autoLearningHydrated = false;
let adaptiveAllowlistHosts = new Set();
let adaptiveDenylistHosts = new Set();

let manualBlockStatePromise = null;
let manualBlockFlushTimer = null;
let manualBlockingHydrated = false;

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
        const facebookTrackingShield = await readJsonFromRuntime(
          "rules/facebook-tracking-shield.json"
        );
        counts.facebook_tracking_shield = Array.isArray(facebookTrackingShield)
          ? facebookTrackingShield.length
          : null;
      } catch {
        counts.facebook_tracking_shield = null;
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
        const oemGoogleTrackingShield = await readJsonFromRuntime(
          "rules/oem-google-tracking-shield.json"
        );
        counts.oem_google_tracking_shield = Array.isArray(oemGoogleTrackingShield)
          ? oemGoogleTrackingShield.length
          : null;
      } catch {
        counts.oem_google_tracking_shield = null;
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

      try {
        const providerHardShield = await readJsonFromRuntime("rules/provider-hard-shield.json");
        counts.provider_hard_shield = Array.isArray(providerHardShield)
          ? providerHardShield.length
          : null;
      } catch {
        counts.provider_hard_shield = null;
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
  await initializeAutoLearning();

  const [
    settings,
    enabledRulesetIds,
    diagnosticsState,
    staticRuleCounts,
    recentMatchedRules,
    autoLearning
  ] =
    await Promise.all([
      getSettings(),
      getEnabledRulesetIds(),
      getDiagnosticsState(),
      loadStaticRuleCounts(),
      getRecentMatchedRulesSummary(),
      getAutoLearningSummary()
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
    recentMatchedRules,
    autoLearning
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

function createAutoLearnState() {
  return {
    nextRuleId: AUTO_LEARN_RULE_ID_START,
    candidates: {},
    promoted: {}
  };
}

function normalizeAutoLearnCandidate(rawCandidate) {
  if (!rawCandidate || typeof rawCandidate !== "object") {
    return null;
  }

  const host = typeof rawCandidate.host === "string" ? rawCandidate.host.toLowerCase() : "";

  if (!host || !/^[a-z0-9.-]+$/.test(host)) {
    return null;
  }

  const siteKeys = Array.isArray(rawCandidate.siteKeys)
    ? rawCandidate.siteKeys.filter((siteKey) => typeof siteKey === "string").slice(0, AUTO_LEARN_MAX_INITIATOR_SITES)
    : [];

  return {
    host,
    hits: toNonNegativeInteger(rawCandidate.hits, 0),
    maxScore: toNonNegativeInteger(rawCandidate.maxScore, 0),
    firstSeen: toNonNegativeInteger(rawCandidate.firstSeen, Date.now()),
    lastSeen: toNonNegativeInteger(rawCandidate.lastSeen, Date.now()),
    siteKeys,
    sources: {
      network: toNonNegativeInteger(rawCandidate.sources?.network, 0),
      page: toNonNegativeInteger(rawCandidate.sources?.page, 0)
    }
  };
}

function normalizeAutoLearnState(rawState) {
  const fallback = createAutoLearnState();

  if (!rawState || typeof rawState !== "object") {
    return fallback;
  }

  const normalized = {
    nextRuleId: Math.min(
      Math.max(
        toNonNegativeInteger(rawState.nextRuleId, AUTO_LEARN_RULE_ID_START),
        AUTO_LEARN_RULE_ID_START
      ),
      MANUAL_RULE_ID_START - 1
    ),
    candidates: {},
    promoted: {}
  };

  if (rawState.candidates && typeof rawState.candidates === "object") {
    for (const [host, value] of Object.entries(rawState.candidates)) {
      if (Object.keys(normalized.candidates).length >= AUTO_LEARN_MAX_CANDIDATES) {
        break;
      }

      const candidate = normalizeAutoLearnCandidate({
        host,
        ...value
      });

      if (!candidate) {
        continue;
      }

      normalized.candidates[host] = candidate;
    }
  }

  if (rawState.promoted && typeof rawState.promoted === "object") {
    for (const [host, value] of Object.entries(rawState.promoted)) {
      if (typeof host !== "string" || !/^[a-z0-9.-]+$/i.test(host)) {
        continue;
      }

      const ruleId = toNonNegativeInteger(value?.ruleId, 0);

      if (ruleId < AUTO_LEARN_RULE_ID_START || ruleId >= MANUAL_RULE_ID_START) {
        continue;
      }

      normalized.promoted[host.toLowerCase()] = {
        ruleId,
        addedAt: toNonNegativeInteger(value?.addedAt, Date.now()),
        confidence: toNonNegativeInteger(value?.confidence, 0),
        hitsAtPromotion: toNonNegativeInteger(value?.hitsAtPromotion, 0)
      };

      normalized.nextRuleId = Math.max(normalized.nextRuleId, ruleId + 1);
    }
  }

  return normalized;
}

async function getAutoLearnState() {
  if (!autoLearnStatePromise) {
    autoLearnStatePromise = chrome.storage.local
      .get([AUTO_LEARN_STORAGE_KEY])
      .then((stored) => normalizeAutoLearnState(stored[AUTO_LEARN_STORAGE_KEY]));
  }

  return autoLearnStatePromise;
}

async function persistAutoLearnState() {
  const state = await getAutoLearnState();
  await chrome.storage.local.set({
    [AUTO_LEARN_STORAGE_KEY]: state
  });
}

function scheduleAutoLearnPersist() {
  if (autoLearnFlushTimer) {
    return;
  }

  autoLearnFlushTimer = setTimeout(() => {
    autoLearnFlushTimer = null;

    persistAutoLearnState().catch((error) => {
      console.error("Failed to persist auto-learn state", error);
    });
  }, AUTO_LEARN_FLUSH_DELAY_MS);
}

function normalizeHost(host) {
  if (typeof host !== "string") {
    return "";
  }

  return host
    .trim()
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/\.$/, "");
}

function normalizeHostList(rawHosts) {
  if (!Array.isArray(rawHosts)) {
    return [];
  }

  const next = [];
  const seen = new Set();

  for (const rawHost of rawHosts) {
    const normalized = normalizeHost(rawHost);

    if (!normalized || !/^[a-z0-9.-]+$/i.test(normalized) || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    next.push(normalized);
  }

  return next;
}

function isHostInSet(host, hostSet) {
  const normalized = normalizeHost(host);

  if (!normalized || !hostSet || hostSet.size === 0) {
    return false;
  }

  for (const listedHost of hostSet) {
    if (normalized === listedHost || normalized.endsWith(`.${listedHost}`)) {
      return true;
    }
  }

  return false;
}

function updateAdaptiveHostSets(settings) {
  adaptiveAllowlistHosts = new Set(normalizeHostList(settings.adaptiveAllowlistHosts));
  adaptiveDenylistHosts = new Set(normalizeHostList(settings.adaptiveDenylistHosts));
}

function getSiteKey(host) {
  const normalized = normalizeHost(host);

  if (!normalized) {
    return "";
  }

  const parts = normalized.split(".").filter(Boolean);

  if (parts.length <= 2) {
    return normalized;
  }

  const topLevel = parts[parts.length - 1];
  const secondLevel = parts[parts.length - 2];
  const secondLevelCandidates = new Set(["co", "com", "net", "org", "gov", "edu", "ac"]);

  if (topLevel.length === 2 && secondLevelCandidates.has(secondLevel) && parts.length >= 3) {
    return parts.slice(-3).join(".");
  }

  return parts.slice(-2).join(".");
}

function isThirdPartyHost(targetHost, contextHost) {
  const targetSite = getSiteKey(targetHost);
  const contextSite = getSiteKey(contextHost);

  if (!targetSite || !contextSite) {
    return false;
  }

  return targetSite !== contextSite;
}

function hasTrackingHostSignal(host) {
  return AUTO_LEARN_HOST_SIGNAL_REGEX.test(host);
}

function hasTrackingPathSignal(pathname, search) {
  return AUTO_LEARN_PATH_SIGNAL_REGEX.test(`${pathname || ""}${search || ""}`);
}

function isKnownTrackingHost(host) {
  const normalized = normalizeHost(host);

  if (!normalized) {
    return false;
  }

  return AUTO_LEARN_TRACKING_HOST_SUFFIXES.some(
    (suffix) => normalized === suffix || normalized.endsWith(`.${suffix}`)
  );
}

function scoreAutoLearnCandidate({
  host,
  pathname,
  search,
  resourceType,
  source,
  isThirdParty
}) {
  if (!isThirdParty) {
    return 0;
  }

  let score = 0;

  score += 25;

  if (isKnownTrackingHost(host)) {
    score += 55;
  }

  if (hasTrackingHostSignal(host)) {
    score += 20;
  }

  if (hasTrackingPathSignal(pathname, search)) {
    score += 15;
  }

  if (AUTO_LEARN_RESOURCE_TYPES.includes(resourceType)) {
    score += 10;
  }

  if (source === "network") {
    score += 8;
  } else {
    score += 4;
  }

  return Math.min(score, 100);
}

function createAutoLearnRule(ruleId, host) {
  return {
    id: ruleId,
    priority: 1,
    action: {
      type: "block"
    },
    condition: {
      urlFilter: `||${host}^`,
      domainType: "thirdParty",
      resourceTypes: AUTO_LEARN_RESOURCE_TYPES
    }
  };
}

function trimAutoLearnCandidates(state) {
  const entries = Object.entries(state.candidates);

  if (entries.length <= AUTO_LEARN_MAX_CANDIDATES) {
    return;
  }

  entries.sort((entryA, entryB) => {
    const candidateA = entryA[1];
    const candidateB = entryB[1];

    if (candidateA.hits !== candidateB.hits) {
      return candidateA.hits - candidateB.hits;
    }

    if (candidateA.maxScore !== candidateB.maxScore) {
      return candidateA.maxScore - candidateB.maxScore;
    }

    return candidateA.lastSeen - candidateB.lastSeen;
  });

  const toRemove = entries.length - AUTO_LEARN_MAX_CANDIDATES;

  for (let index = 0; index < toRemove; index += 1) {
    delete state.candidates[entries[index][0]];
  }
}

function shouldPromoteCandidate(candidate) {
  if (!candidate) {
    return false;
  }

  if (!isKnownTrackingHost(candidate.host) && !hasTrackingHostSignal(candidate.host)) {
    return false;
  }

  if (candidate.maxScore < AUTO_LEARN_PROMOTE_SCORE) {
    return false;
  }

  if (candidate.hits < AUTO_LEARN_PROMOTE_HITS) {
    return false;
  }

  if (candidate.siteKeys.length < AUTO_LEARN_PROMOTE_SITE_COUNT) {
    return false;
  }

  return true;
}

function touchAutoLearnDedupeCache(key) {
  const now = Date.now();
  const lastSeen = autoLearnDedupeCache.get(key) || 0;

  if (now - lastSeen < AUTO_LEARN_DEDUPE_WINDOW_MS) {
    return false;
  }

  autoLearnDedupeCache.set(key, now);

  if (autoLearnDedupeCache.size <= AUTO_LEARN_DEDUPE_CACHE_MAX) {
    return true;
  }

  for (const [entryKey, entryTimestamp] of autoLearnDedupeCache.entries()) {
    if (now - entryTimestamp > AUTO_LEARN_DEDUPE_WINDOW_MS) {
      autoLearnDedupeCache.delete(entryKey);
    }

    if (autoLearnDedupeCache.size <= AUTO_LEARN_DEDUPE_CACHE_MAX) {
      break;
    }
  }

  return true;
}

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

function createManualBlockState() {
  return {
    nextRuleId: MANUAL_RULE_ID_START,
    hostRules: {},
    hideRulesBySite: {}
  };
}

function normalizeManualHostRuleEntry(host, rawEntry) {
  const normalizedHost = normalizeHost(host);

  if (!normalizedHost || typeof rawEntry !== "object" || !rawEntry) {
    return null;
  }

  const ruleId = toNonNegativeInteger(rawEntry.ruleId, 0);

  if (ruleId < MANUAL_RULE_ID_START || ruleId > MANUAL_RULE_ID_END) {
    return null;
  }

  return {
    host: normalizedHost,
    ruleId,
    addedAt: toNonNegativeInteger(rawEntry.addedAt, Date.now()),
    sourcePageHost: normalizeHost(rawEntry.sourcePageHost)
  };
}

function normalizeManualHideSelector(rawSelector) {
  if (typeof rawSelector !== "string") {
    return "";
  }

  const trimmed = rawSelector.trim();

  if (!trimmed || trimmed.length > 280) {
    return "";
  }

  return trimmed;
}

function normalizeManualBlockState(rawState) {
  const fallback = createManualBlockState();

  if (!rawState || typeof rawState !== "object") {
    return fallback;
  }

  const normalized = {
    nextRuleId: Math.max(
      toNonNegativeInteger(rawState.nextRuleId, MANUAL_RULE_ID_START),
      MANUAL_RULE_ID_START
    ),
    hostRules: {},
    hideRulesBySite: {}
  };

  if (rawState.hostRules && typeof rawState.hostRules === "object") {
    for (const [host, rawEntry] of Object.entries(rawState.hostRules)) {
      if (Object.keys(normalized.hostRules).length >= MANUAL_MAX_HOST_RULES) {
        break;
      }

      const entry = normalizeManualHostRuleEntry(host, rawEntry);

      if (!entry) {
        continue;
      }

      normalized.hostRules[entry.host] = {
        ruleId: entry.ruleId,
        addedAt: entry.addedAt,
        sourcePageHost: entry.sourcePageHost
      };

      normalized.nextRuleId = Math.max(normalized.nextRuleId, entry.ruleId + 1);
    }
  }

  if (rawState.hideRulesBySite && typeof rawState.hideRulesBySite === "object") {
    const siteEntries = Object.entries(rawState.hideRulesBySite).slice(0, MANUAL_MAX_HIDE_SITES);

    for (const [site, rawSelectors] of siteEntries) {
      const normalizedSite = normalizeHost(site);

      if (!normalizedSite || !Array.isArray(rawSelectors)) {
        continue;
      }

      const selectors = [];
      const selectorSeen = new Set();

      for (const rawSelector of rawSelectors) {
        const selector = normalizeManualHideSelector(rawSelector);

        if (!selector || selectorSeen.has(selector)) {
          continue;
        }

        selectorSeen.add(selector);
        selectors.push(selector);

        if (selectors.length >= MANUAL_MAX_HIDE_RULES_PER_SITE) {
          break;
        }
      }

      if (selectors.length > 0) {
        normalized.hideRulesBySite[normalizedSite] = selectors;
      }
    }
  }

  return normalized;
}

async function getManualBlockState() {
  if (!manualBlockStatePromise) {
    manualBlockStatePromise = chrome.storage.local
      .get([MANUAL_BLOCK_STORAGE_KEY])
      .then((stored) => normalizeManualBlockState(stored[MANUAL_BLOCK_STORAGE_KEY]));
  }

  return manualBlockStatePromise;
}

async function persistManualBlockState() {
  const state = await getManualBlockState();
  await chrome.storage.local.set({
    [MANUAL_BLOCK_STORAGE_KEY]: state
  });
}

function scheduleManualBlockPersist() {
  if (manualBlockFlushTimer) {
    return;
  }

  manualBlockFlushTimer = setTimeout(() => {
    manualBlockFlushTimer = null;

    persistManualBlockState().catch((error) => {
      console.error("Failed to persist manual block state", error);
    });
  }, MANUAL_BLOCK_FLUSH_DELAY_MS);
}

function createManualHostRule(ruleId, host) {
  return {
    id: ruleId,
    priority: 1,
    action: {
      type: "block"
    },
    condition: {
      urlFilter: `||${host}^`,
      domainType: "thirdParty",
      resourceTypes: MANUAL_BLOCK_RESOURCE_TYPES
    }
  };
}

function getNextManualRuleId(state) {
  let candidate = Math.max(toNonNegativeInteger(state.nextRuleId, MANUAL_RULE_ID_START), MANUAL_RULE_ID_START);

  const usedRuleIds = new Set(
    Object.values(state.hostRules)
      .map((entry) => toNonNegativeInteger(entry?.ruleId, 0))
      .filter((ruleId) => ruleId >= MANUAL_RULE_ID_START && ruleId <= MANUAL_RULE_ID_END)
  );

  while (usedRuleIds.has(candidate) && candidate <= MANUAL_RULE_ID_END) {
    candidate += 1;
  }

  if (candidate > MANUAL_RULE_ID_END) {
    return null;
  }

  return candidate;
}

async function ensureManualHostBlocked(host, sourcePageUrl = "") {
  const normalizedHost = normalizeHost(host);

  if (!normalizedHost || isHostInSet(normalizedHost, adaptiveAllowlistHosts)) {
    return {
      added: false,
      exists: false,
      skipped: true,
      reason: "allowlisted"
    };
  }

  const state = await getManualBlockState();

  if (Object.hasOwn(state.hostRules, normalizedHost)) {
    return {
      added: false,
      exists: true,
      skipped: false,
      reason: "already-blocked"
    };
  }

  if (Object.keys(state.hostRules).length >= MANUAL_MAX_HOST_RULES) {
    return {
      added: false,
      exists: false,
      skipped: true,
      reason: "host-rule-cap"
    };
  }

  const ruleId = getNextManualRuleId(state);

  if (!ruleId) {
    return {
      added: false,
      exists: false,
      skipped: true,
      reason: "rule-id-cap"
    };
  }

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [createManualHostRule(ruleId, normalizedHost)],
      removeRuleIds: []
    });
  } catch (error) {
    console.warn("Manual host block rule add failed", normalizedHost, error);
    return {
      added: false,
      exists: false,
      skipped: true,
      reason: "dnr-update-failed"
    };
  }

  const sourcePage = parseHttpUrl(sourcePageUrl);

  state.hostRules[normalizedHost] = {
    ruleId,
    addedAt: Date.now(),
    sourcePageHost: normalizeHost(sourcePage?.hostname)
  };

  state.nextRuleId = ruleId + 1;
  scheduleManualBlockPersist();

  return {
    added: true,
    exists: false,
    skipped: false,
    reason: "added"
  };
}

async function addManualHideRuleForPage(pageUrl, rawSelector) {
  const page = parseHttpUrl(pageUrl);
  const selector = normalizeManualHideSelector(rawSelector);

  if (!page || !selector) {
    return {
      added: false,
      exists: false
    };
  }

  const siteKey = getSiteKey(page.hostname);

  if (!siteKey || isHostInSet(siteKey, adaptiveAllowlistHosts)) {
    return {
      added: false,
      exists: false
    };
  }

  const state = await getManualBlockState();
  const existing = Array.isArray(state.hideRulesBySite[siteKey])
    ? state.hideRulesBySite[siteKey]
    : [];

  if (existing.includes(selector)) {
    return {
      added: false,
      exists: true
    };
  }

  const nextSelectors = [...existing, selector].slice(-MANUAL_MAX_HIDE_RULES_PER_SITE);
  state.hideRulesBySite[siteKey] = nextSelectors;
  scheduleManualBlockPersist();

  return {
    added: true,
    exists: false
  };
}

async function getManualHideRulesForPage(pageUrl) {
  const page = parseHttpUrl(pageUrl);

  if (!page) {
    return [];
  }

  const state = await getManualBlockState();
  const host = normalizeHost(page.hostname);
  const siteKey = getSiteKey(host);
  const selectors = new Set();

  for (const key of [host, siteKey]) {
    if (!key || !Array.isArray(state.hideRulesBySite[key])) {
      continue;
    }

    for (const selector of state.hideRulesBySite[key]) {
      const normalized = normalizeManualHideSelector(selector);

      if (normalized) {
        selectors.add(normalized);
      }
    }
  }

  return [...selectors];
}

async function getManualRulesSnapshot() {
  const state = await getManualBlockState();

  const manualHostRules = Object.entries(state.hostRules)
    .map(([host, value]) => ({
      host,
      ruleId: value.ruleId,
      addedAt: value.addedAt,
      sourcePageHost: value.sourcePageHost || ""
    }))
    .sort((entryA, entryB) => entryB.addedAt - entryA.addedAt);

  const manualHideRules = Object.entries(state.hideRulesBySite)
    .flatMap(([siteHost, selectors]) =>
      selectors.map((selector) => ({
        siteHost,
        selector
      }))
    )
    .slice(0, MANUAL_MAX_HIDE_SITES * MANUAL_MAX_HIDE_RULES_PER_SITE);

  return {
    manualHostRules,
    manualHideRules
  };
}

async function removeManualHostRule(host) {
  const normalizedHost = normalizeHost(host);

  if (!normalizedHost) {
    return {
      removed: false,
      reason: "invalid-host"
    };
  }

  const state = await getManualBlockState();
  const entry = state.hostRules[normalizedHost];

  if (!entry) {
    return {
      removed: false,
      reason: "not-found"
    };
  }

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [],
      removeRuleIds: [entry.ruleId]
    });
  } catch (error) {
    console.warn("Manual host rule removal failed", normalizedHost, error);
    return {
      removed: false,
      reason: "dnr-update-failed"
    };
  }

  delete state.hostRules[normalizedHost];
  scheduleManualBlockPersist();

  return {
    removed: true,
    reason: "removed"
  };
}

async function removeManualHideRule(siteHost, rawSelector) {
  const normalizedSiteHost = normalizeHost(siteHost);
  const selector = normalizeManualHideSelector(rawSelector);

  if (!normalizedSiteHost || !selector) {
    return {
      removed: false,
      reason: "invalid-input"
    };
  }

  const state = await getManualBlockState();
  const existing = Array.isArray(state.hideRulesBySite[normalizedSiteHost])
    ? state.hideRulesBySite[normalizedSiteHost]
    : [];

  if (existing.length === 0 || !existing.includes(selector)) {
    return {
      removed: false,
      reason: "not-found"
    };
  }

  const next = existing.filter((entry) => entry !== selector);

  if (next.length === 0) {
    delete state.hideRulesBySite[normalizedSiteHost];
  } else {
    state.hideRulesBySite[normalizedSiteHost] = next;
  }

  scheduleManualBlockPersist();

  return {
    removed: true,
    reason: "removed"
  };
}

async function hydrateManualStateFromDynamicRules() {
  if (manualBlockingHydrated) {
    return;
  }

  const state = await getManualBlockState();
  const dynamicRules = await chrome.declarativeNetRequest.getDynamicRules();

  for (const rule of dynamicRules) {
    if (rule.id < MANUAL_RULE_ID_START || rule.id > MANUAL_RULE_ID_END) {
      continue;
    }

    state.nextRuleId = Math.max(state.nextRuleId, rule.id + 1);

    const urlFilter = rule?.condition?.urlFilter;

    if (typeof urlFilter !== "string" || !urlFilter.startsWith("||") || !urlFilter.endsWith("^")) {
      continue;
    }

    const host = normalizeHost(urlFilter.slice(2, -1));

    if (!host || Object.hasOwn(state.hostRules, host)) {
      continue;
    }

    state.hostRules[host] = {
      ruleId: rule.id,
      addedAt: Date.now(),
      sourcePageHost: ""
    };
  }

  manualBlockingHydrated = true;
  scheduleManualBlockPersist();
}

async function ensureAutoLearnHostPromoted(state, host, confidence, hitsAtPromotion) {
  const normalizedHost = normalizeHost(host);

  if (!normalizedHost || Object.hasOwn(state.promoted, normalizedHost)) {
    return false;
  }

  if (Object.keys(state.promoted).length >= AUTO_LEARN_MAX_DYNAMIC_RULES) {
    return false;
  }

  const ruleId = Math.max(state.nextRuleId, AUTO_LEARN_RULE_ID_START);

  if (ruleId >= MANUAL_RULE_ID_START) {
    return false;
  }

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [createAutoLearnRule(ruleId, normalizedHost)],
      removeRuleIds: []
    });
  } catch (error) {
    console.warn("Auto-learn promotion failed", normalizedHost, error);
    return false;
  }

  state.promoted[normalizedHost] = {
    ruleId,
    addedAt: Date.now(),
    confidence: toNonNegativeInteger(confidence, 0),
    hitsAtPromotion: toNonNegativeInteger(hitsAtPromotion, 0)
  };

  state.nextRuleId = ruleId + 1;
  scheduleAutoLearnPersist();
  return true;
}

async function tryPromoteAutoLearnCandidate(state, candidate) {
  if (!candidate || !shouldPromoteCandidate(candidate)) {
    return;
  }

  const promoted = await ensureAutoLearnHostPromoted(
    state,
    candidate.host,
    candidate.maxScore,
    candidate.hits
  );

  if (promoted) {
    delete state.candidates[candidate.host];
    scheduleAutoLearnPersist();
  }
}

async function processAutoLearnObservation({
  candidateUrl,
  contextUrl,
  resourceType = "other",
  source = "network"
}) {
  if (!autoLearningEnabled) {
    return;
  }

  const candidate = parseHttpUrl(candidateUrl, contextUrl);
  const context = parseHttpUrl(contextUrl);

  if (!candidate || !context) {
    return;
  }

  const candidateHost = normalizeHost(candidate.hostname);
  const contextHost = normalizeHost(context.hostname);

  if (!candidateHost || !contextHost || !isThirdPartyHost(candidateHost, contextHost)) {
    return;
  }

  if (isHostInSet(contextHost, adaptiveAllowlistHosts) || isHostInSet(candidateHost, adaptiveAllowlistHosts)) {
    return;
  }

  if (isHostInSet(candidateHost, adaptiveDenylistHosts)) {
    const state = await getAutoLearnState();

    await ensureAutoLearnHostPromoted(state, candidateHost, 100, AUTO_LEARN_PROMOTE_HITS);
    return;
  }

  const dedupeKey = `${candidateHost}|${getSiteKey(contextHost)}|${resourceType}|${source}`;

  if (!touchAutoLearnDedupeCache(dedupeKey)) {
    return;
  }

  const score = scoreAutoLearnCandidate({
    host: candidateHost,
    pathname: candidate.pathname,
    search: candidate.search,
    resourceType,
    source,
    isThirdParty: true
  });

  if (score < AUTO_LEARN_MIN_SCORE) {
    return;
  }

  const state = await getAutoLearnState();
  const siteKey = getSiteKey(contextHost);
  const record =
    state.candidates[candidateHost] ||
    {
      host: candidateHost,
      hits: 0,
      maxScore: 0,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      siteKeys: [],
      sources: {
        network: 0,
        page: 0
      }
    };

  record.hits += 1;
  record.maxScore = Math.max(record.maxScore, score);
  record.lastSeen = Date.now();

  if (!record.siteKeys.includes(siteKey) && record.siteKeys.length < AUTO_LEARN_MAX_INITIATOR_SITES) {
    record.siteKeys.push(siteKey);
  }

  if (source === "page") {
    record.sources.page += 1;
  } else {
    record.sources.network += 1;
  }

  state.candidates[candidateHost] = record;
  trimAutoLearnCandidates(state);
  scheduleAutoLearnPersist();
  await tryPromoteAutoLearnCandidate(state, record);
}

function queueAutoLearnObservation(observation) {
  autoLearnMutationQueue = autoLearnMutationQueue
    .then(() => processAutoLearnObservation(observation))
    .catch((error) => {
      console.warn("Auto-learn observation processing failed", error);
    });
}

async function hydrateAutoLearnStateFromDynamicRules() {
  if (autoLearningHydrated) {
    return;
  }

  const state = await getAutoLearnState();
  const dynamicRules = await chrome.declarativeNetRequest.getDynamicRules();

  for (const rule of dynamicRules) {
    if (rule.id < AUTO_LEARN_RULE_ID_START || rule.id >= MANUAL_RULE_ID_START) {
      continue;
    }

    state.nextRuleId = Math.max(state.nextRuleId, rule.id + 1);

    const urlFilter = rule?.condition?.urlFilter;

    if (typeof urlFilter !== "string" || !urlFilter.startsWith("||") || !urlFilter.endsWith("^")) {
      continue;
    }

    const host = normalizeHost(urlFilter.slice(2, -1));

    if (!host) {
      continue;
    }

    if (!Object.hasOwn(state.promoted, host)) {
      state.promoted[host] = {
        ruleId: rule.id,
        addedAt: Date.now(),
        confidence: 100,
        hitsAtPromotion: 0
      };
    }
  }

  autoLearningHydrated = true;
  scheduleAutoLearnPersist();
}

function setAutoLearnWebRequestListener(enabled) {
  const beforeRequestApi = chrome.webRequest?.onBeforeRequest;

  if (!beforeRequestApi || typeof beforeRequestApi.addListener !== "function") {
    return;
  }

  if (!enabled) {
    if (autoLearnWebRequestListener && beforeRequestApi.hasListener(autoLearnWebRequestListener)) {
      beforeRequestApi.removeListener(autoLearnWebRequestListener);
    }

    autoLearnWebRequestListener = null;
    return;
  }

  if (autoLearnWebRequestListener && beforeRequestApi.hasListener(autoLearnWebRequestListener)) {
    return;
  }

  autoLearnWebRequestListener = (details) => {
    queueAutoLearnObservation({
      candidateUrl: details.url,
      contextUrl: details.initiator || details.documentUrl || details.originUrl,
      resourceType: details.type || "other",
      source: "network"
    });
  };

  beforeRequestApi.addListener(
    autoLearnWebRequestListener,
    {
      urls: ["http://*/*", "https://*/*"],
      types: AUTO_LEARN_RESOURCE_TYPES
    },
    []
  );
}

async function initializeAutoLearning() {
  await hydrateAutoLearnStateFromDynamicRules();

  const settings = await getSettings();
  updateAdaptiveHostSets(settings);
  autoLearningEnabled = Boolean(settings.blockAutoLearningEnabled);
  setAutoLearnWebRequestListener(autoLearningEnabled);
}

async function initializeManualBlocking() {
  await hydrateManualStateFromDynamicRules();
  await ensureContextMenuRegistration();
}

async function ensureContextMenuRegistration() {
  const contextMenusApi = chrome.contextMenus;

  if (!contextMenusApi || typeof contextMenusApi.removeAll !== "function") {
    return;
  }

  await new Promise((resolve) => {
    contextMenusApi.removeAll(() => {
      resolve();
    });
  });

  await new Promise((resolve) => {
    contextMenusApi.create(
      {
        id: CONTEXT_MENU_BLOCK_CONTENT_ID,
        title: "Block this content",
        contexts: ["all"]
      },
      () => {
        if (chrome.runtime.lastError) {
          console.warn("Context menu creation failed", chrome.runtime.lastError.message);
        }

        resolve();
      }
    );
  });
}

async function tryReadLastContextTarget(tabId) {
  if (!Number.isInteger(tabId) || typeof chrome.tabs?.sendMessage !== "function") {
    return null;
  }

  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: "GET_LAST_CONTEXT_TARGET"
    });

    if (!response || typeof response !== "object") {
      return null;
    }

    return response;
  } catch {
    return null;
  }
}

function buildContextCandidateUrlList(info, contextTarget) {
  const next = new Set();

  for (const rawUrl of [
    info?.srcUrl,
    info?.frameUrl,
    info?.linkUrl,
    ...(Array.isArray(contextTarget?.urls) ? contextTarget.urls : [])
  ]) {
    if (typeof rawUrl !== "string" || !rawUrl) {
      continue;
    }

    next.add(rawUrl);
  }

  return [...next];
}

async function notifyManualHideRulesUpdated(tabId, pageUrl) {
  if (!Number.isInteger(tabId) || typeof chrome.tabs?.sendMessage !== "function") {
    return;
  }

  try {
    await chrome.tabs.sendMessage(tabId, {
      type: "MANUAL_HIDE_RULES_UPDATED",
      pageUrl
    });
  } catch {
    // Ignore tabs without an active content script context.
  }
}

async function notifyManualActionToast(tabId, message, variant = "info") {
  if (!Number.isInteger(tabId) || typeof chrome.tabs?.sendMessage !== "function") {
    return;
  }

  try {
    await chrome.tabs.sendMessage(tabId, {
      type: "SHOW_MANUAL_BLOCK_TOAST",
      message: String(message || "Action complete"),
      variant: variant === "error" ? "error" : "success"
    });
  } catch {
    // Ignore tabs that are not ready for messaging.
  }
}

async function handleContextMenuBlockContentClick(info, tab) {
  const tabId = Number.isInteger(tab?.id) ? tab.id : null;
  const contextTarget = tabId === null ? null : await tryReadLastContextTarget(tabId);

  const pageUrl =
    (typeof info?.pageUrl === "string" && info.pageUrl) ||
    (typeof contextTarget?.pageUrl === "string" && contextTarget.pageUrl) ||
    (typeof tab?.url === "string" ? tab.url : "");

  const contextPage = parseHttpUrl(pageUrl);
  const contextHost = normalizeHost(contextPage?.hostname);
  const candidateUrls = buildContextCandidateUrlList(info, contextTarget);

  let manualHostsAdded = 0;
  let manualHostsExisting = 0;

  for (const rawCandidateUrl of candidateUrls) {
    const candidate = parseHttpUrl(rawCandidateUrl, pageUrl || undefined);

    if (!candidate) {
      continue;
    }

    const candidateHost = normalizeHost(candidate.hostname);

    if (!candidateHost || candidateHost === contextHost) {
      continue;
    }

    const outcome = await ensureManualHostBlocked(candidateHost, pageUrl);

    if (outcome.added) {
      manualHostsAdded += 1;
    } else if (outcome.exists) {
      manualHostsExisting += 1;
    }
  }

  let hideRuleAdded = false;
  const selector = normalizeManualHideSelector(contextTarget?.selector || "");

  if (selector && pageUrl) {
    const hideOutcome = await addManualHideRuleForPage(pageUrl, selector);
    hideRuleAdded = hideOutcome.added || hideOutcome.exists;

    if (hideRuleAdded && tabId !== null) {
      await notifyManualHideRulesUpdated(tabId, pageUrl);
    }
  }

  const blockedAny = manualHostsAdded > 0 || manualHostsExisting > 0 || hideRuleAdded;

  if (!blockedAny) {
    if (tabId !== null) {
      await notifyManualActionToast(
        tabId,
        "No blockable target found. Try right-clicking directly on the ad or popup frame.",
        "error"
      );
    }

    console.info("Manual block skipped: no safe target extracted", {
      pageUrl,
      contextUrlCount: candidateUrls.length
    });
    return;
  }

  if (tabId !== null) {
    const messageParts = [];

    if (manualHostsAdded > 0) {
      messageParts.push(`Blocked ${manualHostsAdded} host${manualHostsAdded === 1 ? "" : "s"}`);
    }

    if (hideRuleAdded) {
      messageParts.push("stored hide rule");
    }

    if (manualHostsAdded === 0 && manualHostsExisting > 0 && !hideRuleAdded) {
      messageParts.push("target already blocked");
    }

    await notifyManualActionToast(
      tabId,
      messageParts.length > 0 ? messageParts.join(" | ") : "Manual block applied",
      "success"
    );
  }

  console.info("Manual block applied", {
    pageUrl,
    manualHostsAdded,
    manualHostsExisting,
    hideRuleApplied: hideRuleAdded
  });
}

async function getAutoLearningSummary() {
  const [state, manualState] = await Promise.all([getAutoLearnState(), getManualBlockState()]);
  const candidates = Object.values(state.candidates);
  const promotedEntries = Object.entries(state.promoted);

  let promotionReady = 0;

  for (const candidate of candidates) {
    if (shouldPromoteCandidate(candidate)) {
      promotionReady += 1;
    }
  }

  const topCandidates = candidates
    .slice()
    .sort((entryA, entryB) => {
      if (entryA.maxScore !== entryB.maxScore) {
        return entryB.maxScore - entryA.maxScore;
      }

      if (entryA.hits !== entryB.hits) {
        return entryB.hits - entryA.hits;
      }

      return entryB.lastSeen - entryA.lastSeen;
    })
    .slice(0, 8)
    .map((entry) => ({
      host: entry.host,
      hits: entry.hits,
      maxScore: entry.maxScore,
      lastSeen: entry.lastSeen,
      siteCount: entry.siteKeys.length
    }));

  const topPromotedHosts = promotedEntries
    .map(([host, value]) => ({
      host,
      ruleId: value.ruleId,
      confidence: value.confidence,
      addedAt: value.addedAt,
      hitsAtPromotion: value.hitsAtPromotion
    }))
    .sort((entryA, entryB) => entryB.addedAt - entryA.addedAt)
    .slice(0, 8);

  const manualHostEntries = Object.entries(manualState.hostRules)
    .map(([host, value]) => ({
      host,
      ruleId: value.ruleId,
      addedAt: value.addedAt,
      sourcePageHost: value.sourcePageHost || ""
    }))
    .sort((entryA, entryB) => entryB.addedAt - entryA.addedAt);

  const manualHideSelectors = Object.values(manualState.hideRulesBySite).reduce(
    (sum, selectors) => sum + selectors.length,
    0
  );

  return {
    enabled: autoLearningEnabled,
    trackedCandidates: candidates.length,
    promotedRules: promotedEntries.length,
    promotionReady,
    allowlistHosts: [...adaptiveAllowlistHosts],
    denylistHosts: [...adaptiveDenylistHosts],
    manualBlockedHosts: manualHostEntries.length,
    manualHideSelectors,
    topCandidates,
    topPromotedHosts,
    recentManualHosts: manualHostEntries.slice(0, 8)
  };
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
      settings.blockFacebookShieldEnabled ||
      settings.blockGlobalTrackersEnabled ||
      settings.blockGlobalAdsEnabled ||
      settings.blockOemGoogleTrackingEnabled ||
      settings.blockRedirectPopupsEnabled
  );

  updateAdaptiveHostSets(settings);
  autoLearningEnabled = Boolean(settings.blockAutoLearningEnabled);

  await updateRulesetState(settings);
  await updateBadgeState(isAnyBlockingEnabled);
  setAutoLearnWebRequestListener(autoLearningEnabled);
}

chrome.runtime.onInstalled.addListener(async () => {
  await migrateLegacySettings();
  await initializeDiagnostics();
  await initializeAutoLearning();
  await initializeManualBlocking();

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
  await initializeAutoLearning();
  await initializeManualBlocking();
  await syncBlockingState();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== "object") {
    return;
  }

  if (message.type === "AUTO_LEARN_PAGE_URLS") {
    const pageUrl = typeof message.pageUrl === "string" ? message.pageUrl : "";
    const candidateUrls = Array.isArray(message.urls) ? message.urls : [];

    if (!autoLearningEnabled || !pageUrl || candidateUrls.length === 0) {
      sendResponse({
        ok: true,
        queued: 0
      });
      return;
    }

    let queued = 0;

    for (const candidateUrl of candidateUrls) {
      if (typeof candidateUrl !== "string" || !candidateUrl) {
        continue;
      }

      queueAutoLearnObservation({
        candidateUrl,
        contextUrl: pageUrl,
        resourceType: "other",
        source: "page"
      });
      queued += 1;
    }

    sendResponse({
      ok: true,
      queued
    });
    return;
  }

  if (message.type === "GET_MANUAL_HIDE_RULES_FOR_PAGE") {
    (async () => {
      const pageUrl = typeof message.pageUrl === "string" ? message.pageUrl : "";
      const selectors = await getManualHideRulesForPage(pageUrl);

      sendResponse({
        ok: true,
        selectors
      });
    })().catch((error) => {
      sendResponse({
        ok: false,
        error: toMessageError(error)
      });
    });

    return true;
  }

  if (message.type === "GET_MANUAL_RULES_SNAPSHOT") {
    (async () => {
      const snapshot = await getManualRulesSnapshot();

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

  if (message.type === "REMOVE_MANUAL_HOST_RULE") {
    (async () => {
      const host = typeof message.host === "string" ? message.host : "";
      const outcome = await removeManualHostRule(host);

      sendResponse({
        ok: outcome.removed,
        removed: outcome.removed,
        reason: outcome.reason
      });
    })().catch((error) => {
      sendResponse({
        ok: false,
        error: toMessageError(error)
      });
    });

    return true;
  }

  if (message.type === "REMOVE_MANUAL_HIDE_RULE") {
    (async () => {
      const siteHost = typeof message.siteHost === "string" ? message.siteHost : "";
      const selector = typeof message.selector === "string" ? message.selector : "";
      const outcome = await removeManualHideRule(siteHost, selector);

      sendResponse({
        ok: outcome.removed,
        removed: outcome.removed,
        reason: outcome.reason
      });
    })().catch((error) => {
      sendResponse({
        ok: false,
        error: toMessageError(error)
      });
    });

    return true;
  }

  if (message.type === "GET_AUTO_LEARNING_SUMMARY") {
    (async () => {
      const summary = await getAutoLearningSummary();
      sendResponse({
        ok: true,
        summary
      });
    })().catch((error) => {
      sendResponse({
        ok: false,
        error: toMessageError(error)
      });
    });

    return true;
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

  const hasAutoLearningSettingChange = changedKeys.includes("blockAutoLearningEnabled");
  const hasAdaptiveHostListChange =
    changedKeys.includes("adaptiveAllowlistHosts") ||
    changedKeys.includes("adaptiveDenylistHosts");

  if (!hasRuleOrLegacyChange && !hasAutoLearningSettingChange && !hasAdaptiveHostListChange) {
    return;
  }

  await migrateLegacySettings();
  await syncBlockingState();
});

chrome.contextMenus?.onClicked?.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_BLOCK_CONTENT_ID) {
    return;
  }

  handleContextMenuBlockContentClick(info, tab).catch((error) => {
    console.warn("Manual context-menu block failed", error);
  });
});

initializeDiagnostics().catch((error) => {
  console.warn("Diagnostics initialization failed", error);
});

initializeAutoLearning().catch((error) => {
  console.warn("Auto-learning initialization failed", error);
});

initializeManualBlocking().catch((error) => {
  console.warn("Manual blocking initialization failed", error);
});
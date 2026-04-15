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
    "ublock_origin_global",
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
  ublock_origin_global: "uBlock Origin Global Bundle",
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
const RECENT_MATCH_QUERY_MIN_INTERVAL_MS = 60 * 1000;

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

const NAVIGATION_ALLOW_RULE_ID_START = 650000;
const NAVIGATION_ALLOW_RULE_ID_END = 659999;
const NAVIGATION_ALLOW_RULE_TTL_MS = 45000;
const BLOCK_WARNING_PAGE_PATH = "src/interstitial/blocked-navigation.html";
const BLOCKED_NAVIGATION_EVENT_COOLDOWN_MS = 2500;
const TRUSTED_NAVIGATION_STORAGE_KEY = "trustedNavigationState";
const TRUSTED_NAVIGATION_MAX_HOSTS = 800;
const TRUSTED_NAVIGATION_MAX_URLS = 2000;

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
let recentMatchedRulesCache = {
  fetchedAt: 0,
  summary: null
};
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
let nextNavigationAllowRuleId = NAVIGATION_ALLOW_RULE_ID_START;
const temporaryNavigationAllowRules = new Map();
const blockedNavigationEventTimestamps = new Map();
let trustedNavigationStatePromise = null;

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
        const ublockOriginMeta = await readJsonFromRuntime("rules/ublock-origin-global.meta.json");
        counts.ublock_origin_global = toNonNegativeInteger(
          ublockOriginMeta.generatedRules,
          null
        );
      } catch {
        counts.ublock_origin_global = null;
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
  const now = Date.now();

  if (
    recentMatchedRulesCache.summary &&
    now - recentMatchedRulesCache.fetchedAt < RECENT_MATCH_QUERY_MIN_INTERVAL_MS
  ) {
    return {
      ...recentMatchedRulesCache.summary,
      byRuleset: { ...recentMatchedRulesCache.summary.byRuleset }
    };
  }

  const summary = {
    available: false,
    windowMs: RECENT_MATCH_LOOKBACK_MS,
    total: 0,
    byRuleset: {},
    error: ""
  };

  if (typeof chrome.declarativeNetRequest.getMatchedRules !== "function") {
    summary.error = "Matched-rule query API is not available in this browser build.";
    recentMatchedRulesCache = {
      fetchedAt: now,
      summary: {
        ...summary,
        byRuleset: { ...summary.byRuleset }
      }
    };
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

    recentMatchedRulesCache = {
      fetchedAt: now,
      summary: {
        ...summary,
        byRuleset: { ...summary.byRuleset }
      }
    };

    return summary;
  } catch (error) {
    const message = toMessageError(error);

    if (
      message.includes("MAX_GETMATCHEDRULES_CALLS_PER_INTERVAL") &&
      recentMatchedRulesCache.summary
    ) {
      return {
        ...recentMatchedRulesCache.summary,
        byRuleset: { ...recentMatchedRulesCache.summary.byRuleset },
        error: `${message} Using cached recent matches.`
      };
    }

    summary.error = message;
    recentMatchedRulesCache = {
      fetchedAt: now,
      summary: {
        ...summary,
        byRuleset: { ...summary.byRuleset }
      }
    };

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

function createTrustedNavigationState() {
  return {
    hosts: [],
    urls: []
  };
}

function normalizeTrustedNavigationUrl(rawUrl, baseUrl = undefined) {
  const parsed = parseHttpUrl(rawUrl, baseUrl);

  if (!parsed) {
    return "";
  }

  parsed.hash = "";
  return parsed.href;
}

function normalizeTrustedNavigationState(rawValue) {
  const fallback = createTrustedNavigationState();

  if (!rawValue || typeof rawValue !== "object") {
    return fallback;
  }

  const hosts = [];
  const hostSeen = new Set();

  for (const rawHost of Array.isArray(rawValue.hosts) ? rawValue.hosts : []) {
    const host = normalizeHost(rawHost);

    if (!host || hostSeen.has(host)) {
      continue;
    }

    hostSeen.add(host);
    hosts.push(host);

    if (hosts.length >= TRUSTED_NAVIGATION_MAX_HOSTS) {
      break;
    }
  }

  const urls = [];
  const urlSeen = new Set();

  for (const rawUrl of Array.isArray(rawValue.urls) ? rawValue.urls : []) {
    const normalizedUrl = normalizeTrustedNavigationUrl(rawUrl);

    if (!normalizedUrl || urlSeen.has(normalizedUrl)) {
      continue;
    }

    urlSeen.add(normalizedUrl);
    urls.push(normalizedUrl);

    if (urls.length >= TRUSTED_NAVIGATION_MAX_URLS) {
      break;
    }
  }

  return {
    hosts,
    urls
  };
}

async function getTrustedNavigationState() {
  if (!trustedNavigationStatePromise) {
    trustedNavigationStatePromise = chrome.storage.local
      .get([TRUSTED_NAVIGATION_STORAGE_KEY])
      .then((stored) => normalizeTrustedNavigationState(stored[TRUSTED_NAVIGATION_STORAGE_KEY]));
  }

  return trustedNavigationStatePromise;
}

async function persistTrustedNavigationState() {
  const state = await getTrustedNavigationState();
  await chrome.storage.local.set({
    [TRUSTED_NAVIGATION_STORAGE_KEY]: state
  });
}

function isTrustedNavigationHost(state, host) {
  if (!state || !host || !Array.isArray(state.hosts) || state.hosts.length === 0) {
    return false;
  }

  for (const trustedHost of state.hosts) {
    if (host === trustedHost || host.endsWith(`.${trustedHost}`)) {
      return true;
    }
  }

  return false;
}

function parseBlockedNavigationPayload(payload) {
  const blocked = parseHttpUrl(payload?.blockedUrl, payload?.sourceUrl || undefined);
  const target =
    parseHttpUrl(payload?.targetUrl, blocked?.href || payload?.sourceUrl || undefined) || blocked;

  if (!blocked || !target) {
    return null;
  }

  const source = parseHttpUrl(payload?.sourceUrl || "");
  const targetUrl = normalizeTrustedNavigationUrl(target.href);
  const targetHost = normalizeHost(target.hostname);

  if (!targetUrl || !targetHost) {
    return null;
  }

  return {
    blockedUrl: blocked.href,
    targetUrl,
    sourceUrl: source ? source.href : "",
    reason: String(payload?.reason || "suspicious-navigation"),
    targetHost
  };
}

async function isTrustedNavigationDestination(rawTargetUrl) {
  const targetUrl = normalizeTrustedNavigationUrl(rawTargetUrl);

  if (!targetUrl) {
    return false;
  }

  const parsedTarget = parseHttpUrl(targetUrl);

  if (!parsedTarget) {
    return false;
  }

  const targetHost = normalizeHost(parsedTarget.hostname);
  const state = await getTrustedNavigationState();

  if (state.urls.includes(targetUrl)) {
    return true;
  }

  return isTrustedNavigationHost(state, targetHost);
}

async function trustNavigationDestination(rawTargetUrl) {
  const targetUrl = normalizeTrustedNavigationUrl(rawTargetUrl);
  const parsedTarget = parseHttpUrl(targetUrl);

  if (!targetUrl || !parsedTarget) {
    return {
      saved: false,
      reason: "invalid-target"
    };
  }

  const targetHost = normalizeHost(parsedTarget.hostname);

  if (!targetHost) {
    return {
      saved: false,
      reason: "invalid-host"
    };
  }

  const state = await getTrustedNavigationState();
  let changed = false;

  if (!state.urls.includes(targetUrl)) {
    state.urls.unshift(targetUrl);

    if (state.urls.length > TRUSTED_NAVIGATION_MAX_URLS) {
      state.urls.length = TRUSTED_NAVIGATION_MAX_URLS;
    }

    changed = true;
  }

  if (!state.hosts.includes(targetHost)) {
    state.hosts.unshift(targetHost);

    if (state.hosts.length > TRUSTED_NAVIGATION_MAX_HOSTS) {
      state.hosts.length = TRUSTED_NAVIGATION_MAX_HOSTS;
    }

    changed = true;
  }

  if (changed) {
    await persistTrustedNavigationState();
  }

  return {
    saved: changed,
    host: targetHost,
    url: targetUrl
  };
}

function getTabIdFromSender(sender) {
  return Number.isInteger(sender?.tab?.id) ? sender.tab.id : null;
}

function getNextNavigationAllowRuleId() {
  const usedRuleIds = new Set();

  for (const entry of temporaryNavigationAllowRules.values()) {
    if (entry && Number.isInteger(entry.ruleId)) {
      usedRuleIds.add(entry.ruleId);
    }
  }

  const span = NAVIGATION_ALLOW_RULE_ID_END - NAVIGATION_ALLOW_RULE_ID_START + 1;

  for (let offset = 0; offset < span; offset += 1) {
    const candidate =
      NAVIGATION_ALLOW_RULE_ID_START +
      ((nextNavigationAllowRuleId - NAVIGATION_ALLOW_RULE_ID_START + offset) % span);

    if (usedRuleIds.has(candidate)) {
      continue;
    }

    nextNavigationAllowRuleId =
      candidate >= NAVIGATION_ALLOW_RULE_ID_END
        ? NAVIGATION_ALLOW_RULE_ID_START
        : candidate + 1;
    return candidate;
  }

  return null;
}

function createNavigationAllowRule(ruleId, tabId, host) {
  return {
    id: ruleId,
    priority: 10000,
    action: {
      type: "allow"
    },
    condition: {
      urlFilter: `||${host}^`,
      resourceTypes: ["main_frame", "sub_frame"],
      tabIds: [tabId]
    }
  };
}

async function clearTemporaryNavigationAllowRule(tabId) {
  if (!Number.isInteger(tabId)) {
    return;
  }

  const entry = temporaryNavigationAllowRules.get(tabId);

  if (!entry) {
    return;
  }

  if (entry.timeoutId) {
    clearTimeout(entry.timeoutId);
  }

  temporaryNavigationAllowRules.delete(tabId);

  if (typeof chrome.declarativeNetRequest.updateSessionRules !== "function") {
    return;
  }

  try {
    await chrome.declarativeNetRequest.updateSessionRules({
      addRules: [],
      removeRuleIds: [entry.ruleId]
    });
  } catch (error) {
    console.warn("Failed to clear temporary navigation allow rule", error);
  }
}

async function installTemporaryNavigationAllowRule(tabId, host) {
  if (!Number.isInteger(tabId)) {
    return {
      applied: false,
      reason: "invalid-tab"
    };
  }

  if (typeof chrome.declarativeNetRequest.updateSessionRules !== "function") {
    return {
      applied: false,
      reason: "session-rules-unavailable"
    };
  }

  const normalizedHost = normalizeHost(host);

  if (!normalizedHost) {
    return {
      applied: false,
      reason: "invalid-host"
    };
  }

  await clearTemporaryNavigationAllowRule(tabId);

  const ruleId = getNextNavigationAllowRuleId();

  if (!ruleId) {
    return {
      applied: false,
      reason: "rule-cap-reached"
    };
  }

  try {
    await chrome.declarativeNetRequest.updateSessionRules({
      addRules: [createNavigationAllowRule(ruleId, tabId, normalizedHost)],
      removeRuleIds: []
    });
  } catch (error) {
    console.warn("Failed to add temporary navigation allow rule", error);
    return {
      applied: false,
      reason: "rule-install-failed"
    };
  }

  const timeoutId = setTimeout(() => {
    clearTemporaryNavigationAllowRule(tabId).catch((error) => {
      console.warn("Failed to expire temporary navigation allow rule", error);
    });
  }, NAVIGATION_ALLOW_RULE_TTL_MS);

  temporaryNavigationAllowRules.set(tabId, {
    ruleId,
    host: normalizedHost,
    timeoutId
  });

  return {
    applied: true,
    reason: "installed",
    ruleId
  };
}

function buildBlockWarningUrl({ blockedUrl, targetUrl, sourceUrl, reason }) {
  const pageUrl = new URL(chrome.runtime.getURL(BLOCK_WARNING_PAGE_PATH));

  pageUrl.searchParams.set("blocked", blockedUrl);
  pageUrl.searchParams.set("target", targetUrl);

  if (sourceUrl) {
    pageUrl.searchParams.set("source", sourceUrl);
  }

  if (reason) {
    pageUrl.searchParams.set("reason", reason);
  }

  return pageUrl.toString();
}

function shouldHandleBlockedNavigationEvent(tabId, rawUrl) {
  if (!Number.isInteger(tabId) || tabId < 0) {
    return false;
  }

  const parsed = parseHttpUrl(rawUrl);

  if (!parsed) {
    return false;
  }

  const now = Date.now();
  const dedupeKey = `${tabId}|${parsed.href}`;
  const lastSeen = blockedNavigationEventTimestamps.get(dedupeKey) || 0;

  if (now - lastSeen < BLOCKED_NAVIGATION_EVENT_COOLDOWN_MS) {
    return false;
  }

  blockedNavigationEventTimestamps.set(dedupeKey, now);

  for (const [key, timestamp] of blockedNavigationEventTimestamps.entries()) {
    if (now - timestamp > BLOCKED_NAVIGATION_EVENT_COOLDOWN_MS * 4) {
      blockedNavigationEventTimestamps.delete(key);
    }
  }

  return true;
}

async function openBlockedNavigationWarning(tabId, payload) {
  if (!Number.isInteger(tabId)) {
    return {
      ok: false,
      error: "Missing tab context"
    };
  }

  const navigation = parseBlockedNavigationPayload(payload);

  if (!navigation) {
    return {
      ok: false,
      error: "Invalid blocked navigation details"
    };
  }

  const warningUrl = buildBlockWarningUrl({
    blockedUrl: navigation.blockedUrl,
    targetUrl: navigation.targetUrl,
    sourceUrl: navigation.sourceUrl,
    reason: navigation.reason
  });

  await chrome.tabs.update(tabId, {
    url: warningUrl
  });

  return {
    ok: true
  };
}

async function proceedBlockedNavigation(tabId, payload) {
  if (!Number.isInteger(tabId)) {
    return {
      ok: false,
      error: "Missing tab context"
    };
  }

  const navigation = parseBlockedNavigationPayload(payload);

  if (!navigation) {
    return {
      ok: false,
      error: "Invalid destination URL"
    };
  }

  const allowRule = await installTemporaryNavigationAllowRule(tabId, navigation.targetHost);

  await chrome.tabs.update(tabId, {
    url: navigation.targetUrl
  });

  return {
    ok: true,
    destinationUrl: navigation.targetUrl,
    allowRuleApplied: allowRule.applied,
    allowRuleReason: allowRule.reason
  };
}

async function handleSuspiciousNavigation(tabId, payload) {
  const navigation = parseBlockedNavigationPayload(payload);

  if (!navigation) {
    return {
      ok: false,
      error: "Invalid blocked navigation details"
    };
  }

  const trusted = await isTrustedNavigationDestination(navigation.targetUrl);

  if (trusted) {
    const outcome = await proceedBlockedNavigation(tabId, navigation);
    return {
      ...outcome,
      trustedBypass: true
    };
  }

  return openBlockedNavigationWarning(tabId, navigation);
}

async function trustBlockedNavigationAndProceed(tabId, payload) {
  const navigation = parseBlockedNavigationPayload(payload);

  if (!navigation) {
    return {
      ok: false,
      error: "Invalid blocked navigation details"
    };
  }

  const trustResult = await trustNavigationDestination(navigation.targetUrl);
  const proceedResult = await proceedBlockedNavigation(tabId, navigation);

  return {
    ...proceedResult,
    trustedSaved: trustResult.saved,
    trustedHost: trustResult.host || "",
    trustedUrl: trustResult.url || navigation.targetUrl
  };
}

async function clearSiteCacheForOrigin(tabId, rawUrl) {
  if (typeof chrome.browsingData?.remove !== "function") {
    return {
      ok: false,
      error: "Browsing data API is unavailable"
    };
  }

  const parsed = parseHttpUrl(rawUrl);

  if (!parsed) {
    return {
      ok: false,
      error: "Invalid site URL"
    };
  }

  await chrome.browsingData.remove(
    {
      origins: [parsed.origin]
    },
    {
      cache: true,
      cacheStorage: true
    }
  );

  if (Number.isInteger(tabId) && typeof chrome.tabs?.reload === "function") {
    try {
      await chrome.tabs.reload(tabId, {
        bypassCache: true
      });
    } catch {
      // Ignore reload failures in restricted tabs.
    }
  }

  return {
    ok: true,
    origin: parsed.origin
  };
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") {
    return;
  }

  if (message.type === "OPEN_BLOCK_WARNING") {
    (async () => {
      const tabId = getTabIdFromSender(sender);
      const outcome = await handleSuspiciousNavigation(tabId, {
        blockedUrl: typeof message.blockedUrl === "string" ? message.blockedUrl : "",
        targetUrl: typeof message.targetUrl === "string" ? message.targetUrl : "",
        sourceUrl: typeof message.sourceUrl === "string" ? message.sourceUrl : "",
        reason: typeof message.reason === "string" ? message.reason : ""
      });

      sendResponse(outcome);
    })().catch((error) => {
      sendResponse({
        ok: false,
        error: toMessageError(error)
      });
    });

    return true;
  }

  if (message.type === "TRUST_BLOCKED_TARGET_AND_PROCEED") {
    (async () => {
      const tabId = getTabIdFromSender(sender);
      const outcome = await trustBlockedNavigationAndProceed(tabId, {
        blockedUrl: typeof message.blockedUrl === "string" ? message.blockedUrl : "",
        targetUrl: typeof message.targetUrl === "string" ? message.targetUrl : "",
        sourceUrl: typeof message.sourceUrl === "string" ? message.sourceUrl : "",
        reason: typeof message.reason === "string" ? message.reason : ""
      });

      sendResponse(outcome);
    })().catch((error) => {
      sendResponse({
        ok: false,
        error: toMessageError(error)
      });
    });

    return true;
  }

  if (message.type === "NAVIGATE_BLOCKED_TARGET") {
    (async () => {
      const tabId = getTabIdFromSender(sender);
      const outcome = await proceedBlockedNavigation(tabId, {
        blockedUrl: typeof message.blockedUrl === "string" ? message.blockedUrl : "",
        targetUrl: typeof message.targetUrl === "string" ? message.targetUrl : "",
        sourceUrl: typeof message.sourceUrl === "string" ? message.sourceUrl : ""
      });

      sendResponse(outcome);
    })().catch((error) => {
      sendResponse({
        ok: false,
        error: toMessageError(error)
      });
    });

    return true;
  }

  if (message.type === "CLEAR_SITE_CACHE") {
    (async () => {
      const tabId = Number.isInteger(message.tabId) ? message.tabId : getTabIdFromSender(sender);
      const siteUrl = typeof message.siteUrl === "string" ? message.siteUrl : "";
      const outcome = await clearSiteCacheForOrigin(tabId, siteUrl);
      sendResponse(outcome);
    })().catch((error) => {
      sendResponse({
        ok: false,
        error: toMessageError(error)
      });
    });

    return true;
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

chrome.tabs?.onRemoved?.addListener((tabId) => {
  clearTemporaryNavigationAllowRule(tabId).catch((error) => {
    console.warn("Failed to clear temporary navigation rule on tab close", error);
  });
});

chrome.webNavigation?.onErrorOccurred?.addListener(
  (details) => {
    if (details.frameId !== 0 || details.error !== "net::ERR_BLOCKED_BY_CLIENT") {
      return;
    }

    if (!shouldHandleBlockedNavigationEvent(details.tabId, details.url)) {
      return;
    }

    (async () => {
      const trusted = await isTrustedNavigationDestination(details.url);

      if (trusted) {
        await proceedBlockedNavigation(details.tabId, {
          blockedUrl: details.url,
          targetUrl: details.url,
          sourceUrl: "",
          reason: "trusted-bypass"
        });
        return;
      }

      await openBlockedNavigationWarning(details.tabId, {
        blockedUrl: details.url,
        targetUrl: details.url,
        sourceUrl: "",
        reason: "blocked-by-rule"
      });
    })().catch((error) => {
      console.warn("Failed to process blocked navigation warning", error);
    });
  },
  {
    url: [
      {
        schemes: ["http", "https"]
      }
    ]
  }
);

initializeDiagnostics().catch((error) => {
  console.warn("Diagnostics initialization failed", error);
});

initializeAutoLearning().catch((error) => {
  console.warn("Auto-learning initialization failed", error);
});

initializeManualBlocking().catch((error) => {
  console.warn("Manual blocking initialization failed", error);
});
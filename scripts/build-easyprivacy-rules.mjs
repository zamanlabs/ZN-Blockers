import fs from "node:fs/promises";
import path from "node:path";

const MAX_RULES_DEFAULT = toMaxRules(process.env.MAX_RULES, 29000);
const MAX_URL_FILTER_LENGTH = 900;
const MAX_DOMAINS_PER_SIDE = 100;

const LIST_SPECS = [
  {
    id: "easyprivacy_global",
    name: "EasyPrivacy",
    sourceType: "file",
    sourcePath: path.resolve("rules", "links.txt"),
    outputPath: path.resolve("rules", "easyprivacy-global.json"),
    metaPath: path.resolve("rules", "easyprivacy-global.meta.json"),
    maxRules: toMaxRules(process.env.MAX_RULES_EASYPRIVACY, MAX_RULES_DEFAULT)
  },
  {
    id: "easylist_global_ads",
    name: "EasyList",
    sourceType: "url",
    sourceUrl: "https://easylist.to/easylist/easylist.txt",
    cachePath: path.resolve("rules", "sources", "easylist.txt"),
    outputPath: path.resolve("rules", "easylist-global.json"),
    metaPath: path.resolve("rules", "easylist-global.meta.json"),
    maxRules: toMaxRules(process.env.MAX_RULES_EASYLIST, MAX_RULES_DEFAULT)
  },
  {
    id: "adguard_base_ads",
    name: "AdGuard Base",
    sourceType: "url",
    sourceUrl: "https://filters.adtidy.org/extension/chromium/filters/2.txt",
    cachePath: path.resolve("rules", "sources", "adguard-base.txt"),
    outputPath: path.resolve("rules", "adguard-base-global.json"),
    metaPath: path.resolve("rules", "adguard-base-global.meta.json"),
    maxRules: toMaxRules(process.env.MAX_RULES_ADGUARD, MAX_RULES_DEFAULT)
  }
];

const RESOURCE_TYPE_MAP = new Map([
  ["script", "script"],
  ["image", "image"],
  ["stylesheet", "stylesheet"],
  ["object", "object"],
  ["font", "font"],
  ["media", "media"],
  ["subdocument", "sub_frame"],
  ["document", "main_frame"],
  ["xmlhttprequest", "xmlhttprequest"],
  ["xhr", "xmlhttprequest"],
  ["ping", "ping"],
  ["websocket", "websocket"],
  ["other", "other"]
]);

const UNSUPPORTED_OPTION_PREFIXES = [
  "badfilter",
  "csp",
  "denyallow",
  "elemhide",
  "from",
  "generichide",
  "genericblock",
  "header",
  "method",
  "permissions",
  "popup",
  "redirect",
  "redirect-rule",
  "removeparam",
  "rewrite",
  "sitekey",
  "to",
  "urltransform"
];

function toMaxRules(rawValue, fallback) {
  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed) || parsed < 1000) {
    return fallback;
  }

  return Math.floor(parsed);
}

function toRelativePath(filePath) {
  return path.relative(process.cwd(), filePath).replace(/\\/g, "/");
}

function isCommentOrEmptyLine(line) {
  return !line || line.startsWith("!") || line.startsWith("[");
}

function isCosmeticRule(line) {
  return (
    line.includes("##") ||
    line.includes("#@#") ||
    line.includes("#?#") ||
    line.includes("#$#") ||
    line.includes("#%#")
  );
}

function isUnsupportedPattern(pattern) {
  if (!pattern) {
    return true;
  }

  if (pattern.startsWith("/") && pattern.endsWith("/") && pattern.length > 1) {
    return true;
  }

  if (/\s/.test(pattern)) {
    return true;
  }

  if (/[^\x20-\x7E]/.test(pattern)) {
    return true;
  }

  if (pattern.length > MAX_URL_FILTER_LENGTH) {
    return true;
  }

  if (pattern === "*" || pattern === "||") {
    return true;
  }

  return false;
}

function parseDomain(rawDomain) {
  const domain = rawDomain.trim().toLowerCase();

  if (!domain || domain.includes("*") || domain.includes("/") || domain.includes("?")) {
    return null;
  }

  const normalized = domain.replace(/^\.+|\.+$/g, "");

  if (!normalized || !/^[a-z0-9.-]+$/.test(normalized)) {
    return null;
  }

  return normalized;
}

function parseOptions(optionText) {
  const result = {
    resourceTypes: [],
    domainType: null,
    initiatorDomains: [],
    excludedInitiatorDomains: [],
    skip: false,
    reason: ""
  };

  if (!optionText) {
    return result;
  }

  const resourceTypes = new Set();
  const tokens = optionText
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  for (const token of tokens) {
    const lowerToken = token.toLowerCase();

    if (!lowerToken) {
      continue;
    }

    if (lowerToken.startsWith("domain=")) {
      const values = token.slice(token.indexOf("=") + 1).split("|");

      for (const value of values) {
        const trimmed = value.trim();

        if (!trimmed) {
          continue;
        }

        const isExcluded = trimmed.startsWith("~");
        const parsed = parseDomain(isExcluded ? trimmed.slice(1) : trimmed);

        if (!parsed) {
          continue;
        }

        if (isExcluded) {
          result.excludedInitiatorDomains.push(parsed);
        } else {
          result.initiatorDomains.push(parsed);
        }
      }

      continue;
    }

    if (lowerToken === "third-party") {
      result.domainType = "thirdParty";
      continue;
    }

    if (lowerToken === "~third-party" || lowerToken === "first-party") {
      result.domainType = "firstParty";
      continue;
    }

    if (lowerToken === "important" || lowerToken === "match-case") {
      continue;
    }

    if (lowerToken.startsWith("~")) {
      const negatedType = lowerToken.slice(1);

      if (RESOURCE_TYPE_MAP.has(negatedType)) {
        result.skip = true;
        result.reason = "negated-resource-type";
        return result;
      }
    }

    const mappedType = RESOURCE_TYPE_MAP.get(lowerToken);

    if (mappedType) {
      resourceTypes.add(mappedType);
      continue;
    }

    const isUnsupported = UNSUPPORTED_OPTION_PREFIXES.some((prefix) =>
      lowerToken === prefix || lowerToken.startsWith(`${prefix}=`)
    );

    if (isUnsupported) {
      result.skip = true;
      result.reason = `unsupported-option:${lowerToken}`;
      return result;
    }
  }

  if (result.initiatorDomains.length > MAX_DOMAINS_PER_SIDE) {
    result.skip = true;
    result.reason = "too-many-initiator-domains";
    return result;
  }

  if (result.excludedInitiatorDomains.length > MAX_DOMAINS_PER_SIDE) {
    result.skip = true;
    result.reason = "too-many-excluded-initiator-domains";
    return result;
  }

  result.resourceTypes = [...resourceTypes];
  return result;
}

function buildRule(rawLine, id) {
  const isException = rawLine.startsWith("@@");
  const line = isException ? rawLine.slice(2) : rawLine;

  const optionIndex = line.lastIndexOf("$");
  const pattern = (optionIndex >= 0 ? line.slice(0, optionIndex) : line).trim();
  const optionsText = optionIndex >= 0 ? line.slice(optionIndex + 1).trim() : "";

  if (isUnsupportedPattern(pattern)) {
    return {
      rule: null,
      reason: "unsupported-pattern"
    };
  }

  const parsedOptions = parseOptions(optionsText);

  if (parsedOptions.skip) {
    return {
      rule: null,
      reason: parsedOptions.reason || "unsupported-options"
    };
  }

  const condition = {
    urlFilter: pattern
  };

  if (parsedOptions.resourceTypes.length > 0) {
    condition.resourceTypes = parsedOptions.resourceTypes;
  }

  if (parsedOptions.domainType) {
    condition.domainType = parsedOptions.domainType;
  }

  if (parsedOptions.initiatorDomains.length > 0) {
    condition.initiatorDomains = parsedOptions.initiatorDomains;
  }

  if (parsedOptions.excludedInitiatorDomains.length > 0) {
    condition.excludedInitiatorDomains = parsedOptions.excludedInitiatorDomains;
  }

  return {
    rule: {
      id,
      priority: isException ? 2 : 1,
      action: {
        type: isException ? "allow" : "block"
      },
      condition
    },
    reason: "ok"
  };
}

function incrementCounter(counterMap, key) {
  const current = counterMap.get(key) || 0;
  counterMap.set(key, current + 1);
}

async function readSource(spec) {
  if (spec.sourceType === "file") {
    const sourceText = await fs.readFile(spec.sourcePath, "utf8");
    return {
      sourceText,
      sourceDescriptor: toRelativePath(spec.sourcePath),
      usedCache: false
    };
  }

  try {
    const response = await fetch(spec.sourceUrl, {
      headers: {
        "user-agent": "ZN-blocker-rule-builder/1.0"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const sourceText = await response.text();

    if (spec.cachePath) {
      await fs.mkdir(path.dirname(spec.cachePath), {
        recursive: true
      });
      await fs.writeFile(spec.cachePath, sourceText, "utf8");
    }

    return {
      sourceText,
      sourceDescriptor: spec.sourceUrl,
      usedCache: false
    };
  } catch (error) {
    if (!spec.cachePath) {
      throw error;
    }

    try {
      const sourceText = await fs.readFile(spec.cachePath, "utf8");
      return {
        sourceText,
        sourceDescriptor: `${spec.sourceUrl} (cache: ${toRelativePath(spec.cachePath)})`,
        usedCache: true
      };
    } catch {
      throw new Error(
        `Failed to download ${spec.sourceUrl} and no cache found at ${toRelativePath(spec.cachePath)}: ${String(error)}`
      );
    }
  }
}

function buildRulesFromSource(sourceText, maxRules) {
  const lines = sourceText.split(/\r?\n/);
  const rules = [];
  const skippedReasons = new Map();

  let sourceRuleLines = 0;
  let blockRules = 0;
  let allowRules = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (isCommentOrEmptyLine(line) || isCosmeticRule(line)) {
      continue;
    }

    sourceRuleLines += 1;

    if (rules.length >= maxRules) {
      incrementCounter(skippedReasons, "max-rules-reached");
      continue;
    }

    const nextId = rules.length + 1;
    const { rule, reason } = buildRule(line, nextId);

    if (!rule) {
      incrementCounter(skippedReasons, reason);
      continue;
    }

    if (rule.action.type === "allow") {
      allowRules += 1;
    } else {
      blockRules += 1;
    }

    rules.push(rule);
  }

  return {
    rules,
    sourceTotalLines: lines.length,
    sourceRuleLines,
    blockRules,
    allowRules,
    skippedByReason: Object.fromEntries(
      [...skippedReasons.entries()].sort((a, b) => b[1] - a[1])
    )
  };
}

async function buildList(spec) {
  const { sourceText, sourceDescriptor, usedCache } = await readSource(spec);
  const built = buildRulesFromSource(sourceText, spec.maxRules);

  const metadata = {
    id: spec.id,
    name: spec.name,
    source: sourceDescriptor,
    sourceUrl: spec.sourceType === "url" ? spec.sourceUrl : null,
    usedCache,
    generatedAt: new Date().toISOString(),
    maxRules: spec.maxRules,
    sourceTotalLines: built.sourceTotalLines,
    sourceRuleLines: built.sourceRuleLines,
    generatedRules: built.rules.length,
    blockRules: built.blockRules,
    allowRules: built.allowRules,
    skippedByReason: built.skippedByReason
  };

  await fs.writeFile(spec.outputPath, JSON.stringify(built.rules, null, 2), "utf8");
  await fs.writeFile(spec.metaPath, JSON.stringify(metadata, null, 2), "utf8");

  return {
    id: spec.id,
    name: spec.name,
    outputPath: toRelativePath(spec.outputPath),
    metaPath: toRelativePath(spec.metaPath),
    metadata
  };
}

async function main() {
  const summaries = [];

  for (const spec of LIST_SPECS) {
    const summary = await buildList(spec);
    summaries.push(summary);

    console.log(`Built ${summary.name}`);
    console.log(`  Rules: ${summary.metadata.generatedRules}`);
    console.log(`  Output: ${summary.outputPath}`);
    console.log(`  Meta: ${summary.metaPath}`);
    console.log(`  Cache mode: ${summary.metadata.usedCache ? "fallback" : "live"}`);
  }

  const totalRules = summaries.reduce((acc, entry) => acc + entry.metadata.generatedRules, 0);
  console.log(`Total generated rules across lists: ${totalRules}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
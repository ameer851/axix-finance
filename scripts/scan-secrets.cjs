#!/usr/bin/env node
/**
 * Simple secret scanner for repository files.
 * Scans tracked (git ls-files) non-ignored text files for high-risk patterns.
 * Exits non-zero if any HIGH severity findings are detected.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function gitFiles() {
  try {
    const out = execSync("git ls-files", { encoding: "utf8" });
    return out.split(/\r?\n/).filter(Boolean);
  } catch (e) {
    console.error("Failed to list git files:", e.message);
    process.exit(2);
  }
}

// Extensions considered binary we'll skip
const BINARY_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".lock",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".pdf",
  ".mp4",
  ".mov",
  ".zip",
  ".gz",
  ".bz2",
  ".7z",
  ".tar",
  ".rar",
]);

// Patterns: Each includes id, description, regex, severity, and optional allow predicate
const patterns = [
  {
    id: "supabase-service-role",
    desc: "Supabase service role key (long JWT starting eyJ...)",
    regex:
      /SUPABASE_SERVICE_ROLE_KEY\s*=\s*"?eyJ[a-zA-Z0-9_-]{10,}\.?[a-zA-Z0-9._-]*"?/,
  },
  {
    id: "supabase-anon-key",
    desc: "Supabase anon key captured",
    regex: /SUPABASE_ANON_KEY\s*=\s*"?eyJ[a-zA-Z0-9_-]{10,}/,
    severity: "medium",
  },
  {
    id: "generic-jwt-secret",
    desc: "Likely JWT secret variable",
    regex: /JWT_SECRET\s*=\s*"?[A-Za-z0-9+\/=]{32,}"?/,
    severity: "high",
  },
  {
    id: "resend-api-key",
    desc: "Resend API key",
    regex: /RESEND_API_KEY\s*=\s*"?re_[A-Za-z0-9_\-]{10,}"?/,
    severity: "high",
  },
  {
    id: "private-key-block",
    desc: "Private key block",
    regex: /-----BEGIN (EC|RSA|OPENSSH|PGP) PRIVATE KEY-----/,
    severity: "critical",
  },
  {
    id: "aws-access-key",
    desc: "AWS Access Key ID",
    regex: /AKIA[0-9A-Z]{16}/,
    severity: "high",
  },
  {
    id: "generic-password",
    desc: "Hard-coded password-like value",
    regex: /password\s*[:=]\s*['"][^'"\n]{8,}['"]/i,
    severity: "medium",
  },
  {
    id: "high-entropy",
    desc: "High entropy base64-ish string",
    regex: /[A-Za-z0-9+\/=]{40,}/,
    severity: "info",
  },
];

const allowList = [
  // Example: allow patterns inside sample env template
  {
    file: ".env.example",
    patternIds: [
      "supabase-anon-key",
      "supabase-service-role",
      "generic-jwt-secret",
      "resend-api-key",
      "high-entropy",
    ],
  },
];

function isAllowed(file, patternId) {
  return allowList.some(
    (a) => a.file === file && a.patternIds.includes(patternId)
  );
}

function classifySeverity(p) {
  return p.severity || "high";
}

function scanFile(relPath) {
  const ext = path.extname(relPath).toLowerCase();
  if (BINARY_EXT.has(ext)) return [];
  const size = fs.statSync(relPath).size;
  if (size > 512 * 1024) return []; // skip >512KB
  const content = fs.readFileSync(relPath, "utf8");
  const findings = [];
  for (const p of patterns) {
    if (p.regex.test(content)) {
      if (isAllowed(relPath, p.id)) continue;
      const lines = content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        if (p.regex.test(line)) {
          findings.push({
            file: relPath,
            line: idx + 1,
            id: p.id,
            desc: p.desc,
            severity: classifySeverity(p),
            sample: line.trim().slice(0, 160),
          });
        }
      });
    }
  }
  return findings;
}

function main() {
  const files = gitFiles();
  const allFindings = [];
  for (const f of files) {
    if (f === ".gitignore") continue;
    if (f === "scripts/scan-secrets.cjs") continue;
    try {
      allFindings.push(...scanFile(f));
    } catch (e) {
      // ignore read errors
    }
  }
  if (!allFindings.length) {
    console.log("✅ No potential secrets detected.");
    return;
  }
  // Group and output
  console.log("⚠ Potential secrets found:");
  for (const finding of allFindings) {
    console.log(
      `${finding.severity.toUpperCase()} ${finding.id} ${finding.file}:${finding.line} -> ${finding.sample}`
    );
  }
  const highOrAbove = allFindings.filter((f) =>
    ["high", "critical"].includes(f.severity)
  );
  if (highOrAbove.length) {
    console.error(
      `\n❌ Failing due to ${highOrAbove.length} high/critical findings.`
    );
    process.exit(1);
  } else {
    console.log("\nNo high/critical findings (only informational).");
  }
}

main();

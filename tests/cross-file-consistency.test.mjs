import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function readFile(relativePath) {
  return readFileSync(join(ROOT, relativePath), 'utf-8');
}

/**
 * Extract the SDK version table from a markdown file.
 * Returns an array of {language, package, version} objects.
 */
function extractSdkVersionTable(content) {
  const lines = content.split('\n');
  const rows = [];
  let inTable = false;

  for (const line of lines) {
    // Detect table rows with version-like content (>= X.Y.Z)
    if (line.includes('>= ') && line.includes('|')) {
      inTable = true;
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 3) {
        rows.push({
          language: cells[0],
          package: cells[1].replace(/`/g, ''),
          version: cells[2].replace(/`/g, '').trim(),
        });
      }
    }
  }

  return rows;
}

const SDK_VERSION_FILES = [
  'send-email/references/installation.md',
  'resend-inbound/SKILL.md',
  'agent-email-inbox/SKILL.md',
];

describe('SDK version consistency', () => {
  const tables = {};
  for (const file of SDK_VERSION_FILES) {
    tables[file] = extractSdkVersionTable(readFile(file));
  }

  it('all files contain SDK version tables', () => {
    for (const file of SDK_VERSION_FILES) {
      assert.ok(
        tables[file].length > 0,
        `${file} must contain an SDK version table`
      );
    }
  });

  it('all files list the same number of SDKs', () => {
    const counts = SDK_VERSION_FILES.map(f => tables[f].length);
    const allSame = counts.every(c => c === counts[0]);
    assert.ok(
      allSame,
      `SDK tables have different row counts: ${SDK_VERSION_FILES.map((f, i) => `${f}=${counts[i]}`).join(', ')}`
    );
  });

  it('all files have identical version numbers for each SDK', () => {
    const reference = tables[SDK_VERSION_FILES[0]];
    for (const file of SDK_VERSION_FILES.slice(1)) {
      const other = tables[file];
      for (const ref of reference) {
        const match = other.find(o => o.language === ref.language);
        assert.ok(match, `${file} is missing SDK entry for ${ref.language}`);
        assert.equal(
          match.version,
          ref.version,
          `Version mismatch for ${ref.language} (${ref.package}): ${SDK_VERSION_FILES[0]} has "${ref.version}" but ${file} has "${match.version}"`
        );
      }
    }
  });
});

describe('internal markdown links', () => {
  const FILES_TO_CHECK = [
    'SKILL.md',
    'send-email/SKILL.md',
    'resend-inbound/SKILL.md',
    'agent-email-inbox/SKILL.md',
  ];

  for (const file of FILES_TO_CHECK) {
    const content = readFile(file);
    const fileDir = join(ROOT, dirname(file));

    // Match [text](relative-path) links — skip URLs and anchors
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkPattern.exec(content)) !== null) {
      const linkTarget = match[2];

      // Skip external URLs and anchor-only links
      if (linkTarget.startsWith('http') || linkTarget.startsWith('#') || linkTarget.startsWith('mailto:')) {
        continue;
      }

      // Strip anchor from path
      const path = linkTarget.split('#')[0];
      if (!path) continue;

      it(`${file}: link to "${path}" resolves to existing file`, () => {
        const resolved = join(fileDir, path);
        assert.ok(
          existsSync(resolved),
          `${file} links to "${path}" but file does not exist at ${resolved}`
        );
      });
    }
  }
});

describe('environment variable naming consistency', () => {
  it('RESEND_API_KEY is the only API key env var name used', () => {
    const allFiles = [
      'SKILL.md',
      'send-email/SKILL.md',
      'resend-inbound/SKILL.md',
      'agent-email-inbox/SKILL.md',
    ];

    for (const file of allFiles) {
      const content = readFile(file);
      // Check for variant spellings that would confuse users
      const badVariants = [
        /RESEND_KEY[^_]/i,
        /RESEND_SECRET[^_]/i,
        /RESEND_TOKEN/i,
        /API_SECRET/i,
      ];

      for (const pattern of badVariants) {
        const found = content.match(pattern);
        assert.ok(
          !found,
          `${file} uses non-standard env var name: "${found?.[0]}". Use RESEND_API_KEY or RESEND_WEBHOOK_SECRET.`
        );
      }
    }
  });
});

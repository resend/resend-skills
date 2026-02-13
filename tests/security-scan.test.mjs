import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

/**
 * Recursively collect all .md files in the repo.
 */
function getAllMarkdownFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.') || entry === 'node_modules' || entry === 'tests') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      getAllMarkdownFiles(full, files);
    } else if (extname(full) === '.md') {
      files.push(full);
    }
  }
  return files;
}

/**
 * These are the exact phrases and patterns that automated security scanners
 * flag as prompt-injection attempts. They must NOT appear as literal text
 * in any documentation file, even in code examples.
 *
 * Patterns are tested case-insensitively.
 */
const INJECTION_PATTERNS = [
  // Direct instruction override phrases
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /disregard\s+(all\s+)?(previous|prior|above)/i,
  /forget\s+(everything|all|what)/i,
  /you\s+are\s+now\b/i,
  /new\s+instructions:/i,
  /system\s+prompt:/i,
  /you\s+must\s+now\b/i,

  // Model-specific tokens that shouldn't appear in docs
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,

  // Combined override + system patterns
  /system[\s-]prompt[\s-]override/i,
  /ignore[\s-]previous[\s-]instructions/i,
];

const allFiles = getAllMarkdownFiles(ROOT);

describe('prompt-injection pattern scan', () => {
  for (const file of allFiles) {
    const relativePath = file.replace(ROOT + '/', '');
    const content = readFileSync(file, 'utf-8');

    for (const pattern of INJECTION_PATTERNS) {
      it(`${relativePath}: no match for ${pattern.source}`, () => {
        const match = content.match(pattern);
        assert.ok(
          !match,
          `${relativePath} contains flagged phrase: "${match?.[0]}". ` +
          `Automated scanners will flag this as a prompt-injection attempt. ` +
          `Describe the category of attack without using the literal phrase.`
        );
      });
    }
  }
});

describe('frontmatter description safety', () => {
  const SKILL_FILES = [
    'SKILL.md',
    'send-email/SKILL.md',
    'resend-inbound/SKILL.md',
    'agent-email-inbox/SKILL.md',
  ];

  // Patterns that should not appear in frontmatter descriptions
  const DESCRIPTION_PATTERNS = [
    /ignore/i,
    /override/i,
    /bypass/i,
    /\binject\b(?!\s*ion)/i,
    /hack/i,
    /exploit/i,
  ];

  for (const file of SKILL_FILES) {
    const content = readFileSync(join(ROOT, file), 'utf-8');
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) continue;

    const frontmatter = match[1];
    const descLine = frontmatter.split('\n').find(l => l.startsWith('description:'));
    if (!descLine) continue;

    const description = descLine.replace(/^description:\s*/, '');

    for (const pattern of DESCRIPTION_PATTERNS) {
      it(`${file} description: no "${pattern.source}" in frontmatter`, () => {
        const found = description.match(pattern);
        assert.ok(
          !found,
          `${file} frontmatter description contains "${found?.[0]}" which may trigger security scanners`
        );
      });
    }
  }
});

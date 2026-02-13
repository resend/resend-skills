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

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const yaml = match[1];
  const result = {};
  let currentKey = null;
  let currentArray = null;
  let currentObj = null;

  for (const line of yaml.split('\n')) {
    // Top-level key with value
    const topLevel = line.match(/^(\w+):\s*(.+)$/);
    if (topLevel) {
      currentArray = null;
      currentObj = null;
      let val = topLevel[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      result[topLevel[1]] = val;
      currentKey = topLevel[1];
      continue;
    }
    // Top-level key without value (object or array parent)
    const topLevelEmpty = line.match(/^(\w+):$/);
    if (topLevelEmpty) {
      currentKey = topLevelEmpty[1];
      currentArray = null;
      currentObj = null;
      continue;
    }
    // Array item start
    if (line.match(/^\s+-\s+\w+:/)) {
      if (!result[currentKey]) result[currentKey] = [];
      currentObj = {};
      result[currentKey].push(currentObj);
      currentArray = result[currentKey];
      const kv = line.match(/^\s+-\s+(\w+):\s*(.*)$/);
      if (kv) {
        let val = kv[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        currentObj[kv[1]] = val === 'true' ? true : val === 'false' ? false : val;
      }
      continue;
    }
    // Nested key-value under object or array item
    const nested = line.match(/^\s{4,}(\w+):\s*(.*)$/);
    if (nested) {
      let val = nested[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      const parsedVal = val === 'true' ? true : val === 'false' ? false : val;
      if (currentObj) {
        currentObj[nested[1]] = parsedVal;
      } else {
        if (!result[currentKey]) result[currentKey] = {};
        result[currentKey][nested[1]] = parsedVal;
      }
    }
  }

  return result;
}

function getH2Sections(content) {
  const lines = content.split('\n');
  return lines
    .filter(l => l.match(/^## /))
    .map(l => l.replace(/^## /, '').trim());
}

const SKILL_FILES = [
  'SKILL.md',
  'send-email/SKILL.md',
  'resend-inbound/SKILL.md',
  'agent-email-inbox/SKILL.md',
];

describe('SKILL.md frontmatter', () => {
  for (const file of SKILL_FILES) {
    describe(file, () => {
      const content = readFile(file);
      const fm = parseFrontmatter(content);

      it('has valid YAML frontmatter', () => {
        assert.ok(fm, `${file} must have YAML frontmatter between --- delimiters`);
      });

      it('has a name field', () => {
        assert.ok(fm.name, `${file} must have a name field`);
      });

      it('has a description field', () => {
        assert.ok(fm.description, `${file} must have a description field`);
      });

      it('name uses only letters, numbers, and hyphens', () => {
        assert.match(fm.name, /^[a-z0-9-]+$/, `name "${fm.name}" should only use lowercase letters, numbers, hyphens`);
      });
    });
  }
});

describe('root SKILL.md metadata', () => {
  const content = readFile('SKILL.md');
  const fm = parseFrontmatter(content);

  it('has metadata.version in semver format', () => {
    assert.ok(fm.metadata, 'root SKILL.md must have metadata');
    assert.ok(fm.metadata.version, 'metadata must have version');
    assert.match(fm.metadata.version, /^\d+\.\d+\.\d+$/, `version "${fm.metadata.version}" must be semver`);
  });

  it('has metadata.author', () => {
    assert.ok(fm.metadata.author, 'metadata must have author');
  });

  it('has metadata.homepage', () => {
    assert.ok(fm.metadata.homepage, 'metadata must have homepage');
  });

  it('has metadata.source', () => {
    assert.ok(fm.metadata.source, 'metadata must have source');
  });

  it('has license field', () => {
    assert.ok(fm.license, 'root SKILL.md must have license');
  });
});

describe('sub-skill inputs', () => {
  const subSkills = SKILL_FILES.filter(f => f !== 'SKILL.md');

  for (const file of subSkills) {
    describe(file, () => {
      const content = readFile(file);
      const fm = parseFrontmatter(content);

      it('declares inputs array', () => {
        assert.ok(Array.isArray(fm.inputs), `${file} must declare inputs`);
      });

      it('declares RESEND_API_KEY as required input', () => {
        const apiKey = fm.inputs.find(i => i.name === 'RESEND_API_KEY');
        assert.ok(apiKey, `${file} must declare RESEND_API_KEY input`);
        assert.equal(apiKey.required, true, 'RESEND_API_KEY must be required');
      });
    });
  }

  for (const file of ['resend-inbound/SKILL.md', 'agent-email-inbox/SKILL.md']) {
    it(`${file} declares RESEND_WEBHOOK_SECRET as required`, () => {
      const content = readFile(file);
      const fm = parseFrontmatter(content);
      const secret = fm.inputs.find(i => i.name === 'RESEND_WEBHOOK_SECRET');
      assert.ok(secret, `${file} must declare RESEND_WEBHOOK_SECRET input`);
      assert.equal(secret.required, true, 'RESEND_WEBHOOK_SECRET must be required for inbound skills');
    });
  }
});

describe('agent-email-inbox section ordering', () => {
  const content = readFile('agent-email-inbox/SKILL.md');
  const sections = getH2Sections(content);

  it('has Security Levels section', () => {
    assert.ok(sections.includes('Security Levels'), 'must have Security Levels section');
  });

  it('has Webhook Setup section', () => {
    assert.ok(sections.includes('Webhook Setup'), 'must have Webhook Setup section');
  });

  it('Security Levels comes BEFORE Webhook Setup', () => {
    const securityIdx = sections.indexOf('Security Levels');
    const webhookIdx = sections.indexOf('Webhook Setup');
    assert.ok(
      securityIdx < webhookIdx,
      `Security Levels (position ${securityIdx}) must come before Webhook Setup (position ${webhookIdx}). ` +
      `Users must choose security level before any email processing code goes live.`
    );
  });

  it('has Troubleshooting section', () => {
    assert.ok(sections.includes('Troubleshooting'), 'must have Troubleshooting section');
  });

  it('has SDK Version Requirements section', () => {
    assert.ok(sections.includes('SDK Version Requirements'), 'must have SDK Version Requirements section');
  });
});

describe('send-email/SKILL.md required sections', () => {
  const content = readFile('send-email/SKILL.md');
  const sections = getH2Sections(content);

  for (const required of ['Overview', 'Quick Start', 'Common Mistakes', 'Testing']) {
    it(`has ${required} section`, () => {
      assert.ok(sections.includes(required), `must have ${required} section`);
    });
  }
});

describe('resend-inbound/SKILL.md required sections', () => {
  const content = readFile('resend-inbound/SKILL.md');
  const sections = getH2Sections(content);

  for (const required of ['Overview', 'Quick Start', 'Common Mistakes']) {
    it(`has ${required} section`, () => {
      assert.ok(sections.includes(required), `must have ${required} section`);
    });
  }
});

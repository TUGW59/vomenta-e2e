import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// Deterministik Kurallar
const privateKeyPrefix = '-----' + 'BEGIN ';
const privateKeySuffix = 'KEY' + '-----';

const rules = [
  {
    id: 'SEC-PATH',
    type: 'path',
    test: (filePath) => filePath.includes('e.env/') || filePath.endsWith('.pem') || filePath.endsWith('.key')
  },
  {
    id: 'SEC-KEY',
    type: 'content',
    test: (line) => new RegExp(privateKeyPrefix + '.*' + privateKeySuffix).test(line)
  },
  {
    id: 'SEC-TOKEN',
    type: 'content',
    test: (line) => {
      if (/ghp_[a-zA-Z0-9]{36}/.test(line)) return true;
      if (/xox[baprs]-[0-9]{10,13}-[a-zA-Z0-9]{24}/.test(line)) return true;
      const match = line.match(/(?:secret|token|api_key|password)["']?\s*[:=]\s*["']([a-zA-Z0-9_\-\.]{20,})["']/i);
      if (match) {
        const val = match[1];
        if (val.toLowerCase().includes('placeholder') || val.toLowerCase().includes('example') || val === 'fake-secret-for-testing-purposes') return false;
        return true;
      }
      return false;
    }
  },
  {
    id: 'SEC-EMAIL',
    type: 'content',
    test: (line) => {
      const matches = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      if (!matches) return false;

      const allowedDomains = new Set([
        'example.com',
        'example.org',
        'example.net',
      ]);

      for (const email of matches) {
        const separatorIndex = email.lastIndexOf('@');
        if (separatorIndex < 1 || separatorIndex === email.length - 1) {
          return true;
        }

        const domain = email.slice(separatorIndex + 1).toLowerCase();
        if (!allowedDomains.has(domain)) {
          return true;
        }
      }

      return false;
    }
  },
  {
    id: 'SEC-PHONE',
    type: 'content',
    test: (line) => /\+[1-9]\d{7,14}\b/.test(line)
  }
];

const suppressions = [];

function scanRepository(repoPath, logger = console.error) {
  // -z ile NUL-delimiter ve deterministik sıralama
  const rawOutput = execSync('git ls-files -z', { cwd: repoPath }).toString('utf8');
  if (!rawOutput) return 0;
  
  const files = rawOutput.split('\0').filter(Boolean).sort();
  let violations = 0;
  
  const decodeTrackedText = (buffer) => {
    if (buffer.length === 0) return '';

    // Binary classification is content-based, never extension-based.
    if (buffer.indexOf(0) !== -1) return null;

    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      return null;
    }
  };

  for (const relPath of files) {
    const filePath = path.resolve(repoPath, relPath);
    if (!filePath.startsWith(path.resolve(repoPath))) {
      logger(`Violation: [SEC-PATH] Path outside repo ${relPath}`);
      violations++;
      continue;
    }

    try {
      const stat = fs.lstatSync(filePath);
      if (stat.isSymbolicLink()) {
        logger(`Violation: [SEC-PATH] Symlink not allowed ${relPath}`);
        violations++;
        continue;
      }
      if (!stat.isFile()) continue;

      let pathViolation = false;
      for (const rule of rules) {
        if (rule.type === 'path' && rule.test(relPath)) {
          if (!suppressions.some(s => s.path === relPath && s.ruleId === rule.id)) {
            logger(`Violation: [${rule.id}] in file path ${relPath}`);
            violations++;
            pathViolation = true;
          }
        }
      }
      if (pathViolation) continue;

      const buffer = fs.readFileSync(filePath);
      const content = decodeTrackedText(buffer);
      if (content === null) continue;
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const rule of rules) {
          if (rule.type === 'content') {
            if (rule.test(line)) {
              if (!suppressions.some(s => s.path === relPath && s.ruleId === rule.id)) {
                logger(`Violation: [${rule.id}] in ${relPath}:${i + 1}`);
                violations++;
              }
            }
          }
        }
      }
    } catch (err) {
      logger(`Violation: [SEC-READ] Failed to read ${relPath}`);
      violations++;
    }
  }
  return violations;
}

function runTests() {
  const scannerPath = path.resolve(new URL(import.meta.url).pathname || import.meta.filename || __filename);
  
  const runScenario = (
    name,
    setupFn,
    expectedCode,
    expectedErrors,
    forbiddenValues = [],
    afterAddFn = null,
  ) => {
    const tmpDir = path.resolve(process.cwd(), '.tmp-sec-scanner-' + Date.now() + '-' + Math.random().toString(36).slice(2));
    fs.mkdirSync(tmpDir, { recursive: true });
    try {
      execSync('git init', { cwd: tmpDir, stdio: 'ignore' });
      setupFn(tmpDir);
      execSync('git add .', { cwd: tmpDir, stdio: 'ignore' });

      if (afterAddFn) {
        afterAddFn(tmpDir);
      }

      let code = 0;
      let out = '';
      try {
        out = execSync(`node "${scannerPath}"`, {
          cwd: tmpDir,
          encoding: 'utf8',
          env: { ...process.env, SELF_TEST_CHILD: '1' },
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      } catch (err) {
        code = err.status || 1;
        out = (err.stdout || '') + (err.stderr || '');
      }
      
      if (code !== expectedCode) throw new Error(`[${name}] Expected exit ${expectedCode}, got ${code}. Output:\n${out}`);
      
      for (const errText of expectedErrors) {
        if (!out.includes(errText)) {
          throw new Error(
            `[${name}] Expected output metadata was not produced.`,
          );
        }
      }

      for (const forbiddenValue of forbiddenValues) {
        if (out.includes(forbiddenValue)) {
          throw new Error(
            `[${name}] Scanner output exposed a matched value.`,
          );
        }
      }

      const forbidden = ['tugw59', 'gmail.com', '90532', 'somebody'];
      for (const f of forbidden) {
         if (out.includes(f)) throw new Error(`[${name}] Output contains sensitive value "${f}". Output:\n${out}`);
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  };

  runScenario('Temiz tracked text', (dir) => {
    fs.writeFileSync(
      path.join(dir, 'safe.txt'),
      'email: user@example.com\nphone: <redacted-phone>',
    );
    fs.writeFileSync(path.join(dir, 'dummy.bin'), Buffer.from([0x00, 0x01]));
  }, 0, ['Security check passed']);

  runScenario('Exact placeholder domain case-insensitive', (dir) => {
    fs.writeFileSync(
      path.join(dir, 'uppercase-placeholder.txt'),
      'email: USER@EXAMPLE.COM',
    );
  }, 0, ['Security check passed']);

  runScenario('Example domain suffix bypass engellenir', (dir) => {
    const badEmail = [
      'user',
      '@',
      'example',
      '.',
      'com',
      '.',
      'invalid',
    ].join('');
    fs.writeFileSync(path.join(dir, 'bad-example-suffix.txt'), badEmail);
  }, 1, ['[SEC-EMAIL] in bad-example-suffix.txt'], [
    ['user', '@', 'example', '.', 'com', '.', 'invalid'].join(''),
  ]);

  runScenario('Benzer domain bypass engellenir', (dir) => {
    const badEmail = [
      'user',
      '@',
      'notexample',
      '.',
      'com',
    ].join('');
    fs.writeFileSync(path.join(dir, 'bad-lookalike-domain.txt'), badEmail);
  }, 1, ['[SEC-EMAIL] in bad-lookalike-domain.txt'], [
    ['user', '@', 'notexample', '.', 'com'].join(''),
  ]);

  runScenario('Yasaklı hassas path', (dir) => {
    fs.mkdirSync(path.join(dir, 'e.env'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'e.env', 'test.txt'), 'test');
  }, 1, ['[SEC-PATH] in file path e.env/test.txt']);

  runScenario('Sentetik e-mail', (dir) => {
    const badEmail = ['some', 'body', '@', 'g', 'mail', '.', 'com'].join('');
    fs.writeFileSync(path.join(dir, 'bad_email.txt'), 'bad ' + badEmail);
  }, 1, ['[SEC-EMAIL] in bad_email.txt'], [
    ['some', 'body', '@', 'g', 'mail', '.', 'com'].join(''),
  ]);

  runScenario('Sentetik secret', (dir) => {
    const secret = ['gh', 'p_', '123456789012345678901234567890123456'].join('');
    fs.writeFileSync(path.join(dir, 'bad_secret.txt'), 'key ' + secret);
  }, 1, ['[SEC-TOKEN] in bad_secret.txt'], [
    ['gh', 'p_', '123456789012345678901234567890123456'].join(''),
  ]);

  runScenario('Global telefon muafiyeti yok', (dir) => {
    const phone = ['+', '90', '555', '123', '4567'].join('');
    fs.writeFileSync(path.join(dir, 'bad_phone.txt'), 'phone ' + phone);
  }, 1, ['[SEC-PHONE] in bad_phone.txt'], [
    ['+', '90', '555', '123', '4567'].join(''),
  ]);

  runScenario('Düz metin secret içeren PNG taranır', (dir) => {
    const secret = ['gh', 'p_', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'].join('');
    fs.writeFileSync(path.join(dir, 'fake.png'), secret);
  }, 1, ['[SEC-TOKEN] in fake.png'], [
    ['gh', 'p_', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'].join(''),
  ]);

  runScenario('Düz metin PII içeren PDF taranır', (dir) => {
    const badEmail = ['pdf', '@', 'unsafe', '.', 'test'].join('');
    fs.writeFileSync(path.join(dir, 'fake.pdf'), badEmail);
  }, 1, ['[SEC-EMAIL] in fake.pdf'], [
    ['pdf', '@', 'unsafe', '.', 'test'].join(''),
  ]);

  runScenario('Gerçek binary kontrollü atlanır', (dir) => {
    fs.writeFileSync(
      path.join(dir, 'real-binary.png'),
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff, 0x10]),
    );
  }, 0, ['Security check passed']);

  runScenario(
    'Okuma hatası fail-closed',
    (dir) => {
      fs.writeFileSync(path.join(dir, 'removed-after-index.txt'), 'safe');
    },
    1,
    ['[SEC-READ] Failed to read removed-after-index.txt'],
    [],
    (dir) => {
      fs.unlinkSync(path.join(dir, 'removed-after-index.txt'));
    },
  );

  runScenario('Newline içeren tracked filename', (dir) => {
    const badEmail = ['some', 'body', '@', 'g', 'mail', '.', 'com'].join('');
    fs.writeFileSync(path.join(dir, 'file\nname.txt'), 'bad ' + badEmail);
  }, 1, ['[SEC-EMAIL] in file\nname.txt']);

  runScenario('Repo dışına symlink', (dir) => {
    fs.symlinkSync('/etc/passwd', path.join(dir, 'link.txt'));
  }, 1, ['[SEC-PATH] Symlink not allowed link.txt']);


}

// Entry point
// When spawned as a child process by a self-test scenario (SELF_TEST_CHILD=1),
// only run production scan — never recurse into runTests().
const isMainRun = process.argv[1] &&
  process.argv[1].endsWith('self-check-security.mjs');

if (isMainRun) {
  if (process.env.SELF_TEST_CHILD === '1') {
    // Child: production-only scan, no self-test recursion
    const violations = scanRepository(process.cwd());
    if (violations > 0) {
      console.error(`\nTotal security violations: ${violations}`);
      process.exit(1);
    }
    console.log('Security check passed. No sensitive data found.');
  } else {
    // Top-level: first run production scan on real repo, then run self-tests
    const violations = scanRepository(process.cwd());
    if (violations > 0) {
      console.error(`\nTotal security violations: ${violations}`);
      console.error('Please resolve these issues. matched values are intentionally suppressed.');
      process.exit(1);
    }
    console.log('Security check passed. No sensitive data found.');
    runTests();
  }
}

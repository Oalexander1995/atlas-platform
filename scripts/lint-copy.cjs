const fs = require('fs');
const path = require('path');

const BANNED_PATTERNS = [
  /\bguaranteed returns\b/i,
  /\bguaranteed\b/i,
  /\bzero-failure\b/i,
  /\brisk-free\b/i,
  /\bsafe returns?\b/i,
  /\bsafe investment\b/i,
  /\bcan't lose\b/i,
  /\bsecure returns\b/i,
  /\blottery\b/i,
];

const ALLOWED_DISCLAIMERS = [
  /is not a guarantee/gi,
  /not a guarantee/gi,
  /not guaranteed/gi,
  /are not guaranteed/gi,
];

const EXCLUDED_PATHS = [
  /scripts\/lint-copy\.(js|cjs)/,
  /tests\/copy-lint\.test\.ts/,
  /Atlas_PRD\.md/,
  /ASSUMPTIONS\.md/,
  /tests\/coach.*\.test\.ts/,
  /node_modules/,
  /\.next/,
  /\.node/,
  /\.git/,
];

function checkContent(content, filePath) {
  // 1. Strip allowed disclaimer phrases
  let sanitized = content;
  for (const disclaimer of ALLOWED_DISCLAIMERS) {
    sanitized = sanitized.replace(disclaimer, '[ALLOWED_DISCLAIMER]');
  }

  const lines = sanitized.split('\n');
  const violations = [];

  lines.forEach((line, index) => {
    for (const pattern of BANNED_PATTERNS) {
      if (pattern.test(line)) {
        violations.push({
          line: index + 1,
          pattern: pattern.toString(),
          content: line.trim(),
        });
      }
    }
  });

  return violations;
}

function scanDirectory(dir, fileList = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relPath = path.relative(process.cwd(), fullPath);

    if (EXCLUDED_PATHS.some((regex) => regex.test(relPath))) {
      continue;
    }

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath, fileList);
    } else if (
      stat.isFile() &&
      /\.(js|jsx|ts|tsx|html|json|md)$/.test(item)
    ) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

function runLint() {
  const rootDir = process.cwd();
  const filesToScan = scanDirectory(path.join(rootDir, 'src'));

  let totalViolations = 0;
  console.log(`Scanning ${filesToScan.length} source files for banned financial copy...`);

  for (const file of filesToScan) {
    const content = fs.readFileSync(file, 'utf-8');
    const violations = checkContent(content, file);

    if (violations.length > 0) {
      totalViolations += violations.length;
      console.error(`\n❌ Violations found in ${path.relative(rootDir, file)}:`);
      violations.forEach((v) => {
        console.error(`   Line ${v.line}: matched ${v.pattern}`);
        console.error(`   "${v.content}"`);
      });
    }
  }

  if (totalViolations > 0) {
    console.error(`\nLint failed with ${totalViolations} prohibited copy violation(s).`);
    process.exit(1);
  } else {
    console.log(`\n✅ Copy lint passed. No banned wording detected.`);
  }
}

if (require.main === module) {
  runLint();
}

module.exports = { checkContent, BANNED_PATTERNS, ALLOWED_DISCLAIMERS };

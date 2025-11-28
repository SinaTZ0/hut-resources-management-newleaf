import fs from 'fs';
import path from 'path';

const TARGET_LENGTH = 64;

/* ------------------------- helpers -------------------------- */

function isTargetLine(line) {
  return (
    (line.startsWith('/*-') && line.endsWith('-*/')) || // plain comment
    (line.startsWith('{/*-') && line.endsWith('-*/}') && line.includes('*/}')) // TSX comment
  );
}

function normalizeLine(line) {
  // strip outer markers and surrounding dashes / spaces
  const inner = line
    .replace(/^\{\/\*\s*-+/, '') // TSX opening
    .replace(/^\/\*\s*-+/, '') // plain opening
    .replace(/-+\s*\*\/\}$/, '') // TSX closing
    .replace(/-+\s*\*\/$/, '') // plain closing
    .trim();

  const body = ` ${inner} `;
  const side = Math.max(0, TARGET_LENGTH - body.length - 4); // 4 = "/*" + " */"
  const left = Math.floor(side / 2);
  const right = side - left;

  // restore the braces if the original line had them
  const open = line.startsWith('{') ? '{' : '';
  const close = line.endsWith('}') ? '}' : '';

  return `${open}/*${'-'.repeat(left)}${body}${'-'.repeat(right)}*/${close}`;
}

/* ----------------------- file system ------------------------ */

function walk(dir, cb) {
  const stat = fs.statSync(dir);
  if (stat.isFile()) return cb(dir);

  fs.readdirSync(dir).forEach((ent) => {
    const full = path.join(dir, ent);
    walk(full, cb);
  });
}

function processFile(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  let changed = false;

  const out = lines.map((raw) => {
    const trimmed = raw.trimStart();
    if (!isTargetLine(trimmed)) return raw;

    const prefix = raw.slice(0, raw.length - trimmed.length); // keep indentation
    const updated = normalizeLine(trimmed);
    changed = true;
    return prefix + updated;
  });

  if (changed) {
    fs.writeFileSync(filePath, out.join('\n'), 'utf8');
    console.log(`✔  ${filePath}`);
  }
}

/* --------------------------- cli ---------------------------- */
// Get all arguments starting from index 2
const targets = process.argv.slice(2);

if (targets.length === 0) {
  console.error('Usage: node fix-dividers.mjs <file-or-folder> [more-files...]');
  process.exit(1);
}

// Iterate over every target provided
targets.forEach((target) => {
  walk(path.resolve(target), processFile);
});

console.log('\nDone.');

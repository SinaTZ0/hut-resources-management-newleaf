import fs from 'node:fs'
import path from 'node:path'

const TARGET_LENGTH = 64

// ----------------- Comment Type Detection -----------------

const COMMENT_PATTERNS = {
  jsxBlock: {
    match: (line) => line.startsWith('{/*-') && line.endsWith('-*/}'),
    extract: (line) =>
      line
        .replace(/^\{\/\*\s*-*\s*/, '')
        .replace(/\s*-*\s*\*\/\}$/, '')
        .trim(),
    format: (body, left, right) => `{/*${'-'.repeat(left)} ${body} ${'-'.repeat(right)}*/}`,
  },
  block: {
    match: (line) => line.startsWith('/*-') && line.endsWith('-*/'),
    extract: (line) =>
      line
        .replace(/^\/\*\s*-*\s*/, '')
        .replace(/\s*-*\s*\*\/$/, '')
        .trim(),
    format: (body, left, right) => `/*${'-'.repeat(left)} ${body} ${'-'.repeat(right)}*/`,
  },
  line: {
    match: (line) => line.startsWith('//-') && line.endsWith('-'),
    extract: (line) =>
      line
        .replace(/^\/\/\s*-*\s*/, '')
        .replace(/\s*-*\s*$/, '')
        .trim(),
    format: (body, left, right) => `// ${'-'.repeat(left)} ${body} ${'-'.repeat(right)}`,
  },
}

// ------------------ Normalization Logic -------------------

function detectCommentType(line) {
  for (const [type, pattern] of Object.entries(COMMENT_PATTERNS)) {
    if (pattern.match(line)) return type
  }
  return null
}

function isDividerComment(line) {
  const type = detectCommentType(line)
  if (!type) return false

  const inner = COMMENT_PATTERNS[type].extract(line)
  return inner.length > 0 && inner.length < 40
}

function normalizeLine(line) {
  const type = detectCommentType(line)
  if (!type) return line

  const pattern = COMMENT_PATTERNS[type]
  const body = pattern.extract(line)

  const overhead = type === 'line' ? 6 : 4 // "// " + " " vs "/*" + "*/"
  const availableSpace = Math.max(0, TARGET_LENGTH - body.length - 2 - overhead)
  const left = Math.floor(availableSpace / 2)
  const right = availableSpace - left

  return pattern.format(body, left, right)
}

// ----------------- File System Utilities ------------------

function walkPath(targetPath, callback) {
  const stat = fs.statSync(targetPath)

  if (stat.isFile()) {
    callback(targetPath)
    return
  }

  for (const entry of fs.readdirSync(targetPath)) {
    walkPath(path.join(targetPath, entry), callback)
  }
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split(/\r?\n/)
  let hasChanges = false

  const normalizedLines = lines.map((rawLine) => {
    const trimmedLine = rawLine.trimStart()
    if (!isDividerComment(trimmedLine)) return rawLine

    const indentation = rawLine.slice(0, rawLine.length - trimmedLine.length)
    const normalizedLine = normalizeLine(trimmedLine)

    if (trimmedLine !== normalizedLine) hasChanges = true
    return indentation + normalizedLine
  })

  if (hasChanges) {
    fs.writeFileSync(filePath, normalizedLines.join('\n'), 'utf8')
    console.log(`✔  ${filePath}`)
  }
}

// -------------------- CLI Entry Point ---------------------

function main() {
  const targets = process.argv.slice(2)

  if (targets.length === 0) {
    console.error('Usage: node normalize-divider-comments.mjs <file-or-folder> [more...]')
    process.exit(1)
  }

  for (const target of targets) {
    walkPath(path.resolve(target), processFile)
  }

  console.log('\nDone.')
}

main()

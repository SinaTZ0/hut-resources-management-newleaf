# Commit Analysis: Add Husky hooks for commit message linting and branch name validation

## Key Words

- Husky, Commitlint, lint-staged, prettier

## Commit Message

```
feat: Add Husky hooks for commit message linting and branch name validation

- Implement commit-msg hook to enforce commit message conventions using commitlint.
- Add pre-commit hook to run lint-staged for code quality checks.
- Create pre-push hook to validate branch names start with an issue number.
- Add commitlint configuration for conventional commit types.
- Introduce utility script to normalize divider comments in files.
- Update package.json to include necessary scripts and dependencies.
- Add Prettier configuration for consistent code formatting.
```

## Code Diff

**`.husky/commit-msg`** (new)

- **Description:** Runs `commitlint` to validate the edited commit message against the project's commit rules.

```sh
npx --no -- commitlint --edit "$1"
```

**`.husky/pre-commit`** (new)

- **Description:** Runs `lint-staged` to format and check staged files before commit.

```sh
# Run lint-staged for code quality checks

npx lint-staged
```

**`.husky/pre-push`** (new)

- **Description:** Validates that branch names start with an issue number (e.g., `123-feature-name`) before push.

```sh
#!/bin/sh
# Validate branch name starts with a number (issue number)
# Example valid names: 123-feature-name, 42-fix-bug, 1-initial-setup

branch_name=$(git symbolic-ref --short HEAD 2>/dev/null)

# Skip validation for main, master, develop, dev branches
if [ "$branch_name" = "main" ] || [ "$branch_name" = "master" ] || [ "$branch_name" = "develop" ] || [ "$branch_name" = "dev" ]; then
  exit 0
fi

# Check if branch name starts with a number (issue number)
if ! echo "$branch_name" | grep -qE '^[0-9]+'; then
  echo ""
  echo "❌ ERROR: Branch name must start with an issue number!"
  echo ""
  echo "Current branch: $branch_name"
  echo ""
  echo "Valid examples:"
  echo "  ✅ 123-feature-user-auth"
  echo "  ✅ 42-fix-login-bug"
  echo "  ✅ 1-initial-setup"
  echo ""
  echo "Invalid examples:"
  echo "  ❌ feature-user-auth"
  echo "  ❌ fix-login-bug"
  echo ""
  exit 1
fi

exit 0
```

**`.prettierrc`** (new)

- **Description:** Prettier configuration used to enforce consistent code formatting across the project.

```json
{
  "printWidth": 100,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": false,
  "singleQuote": true,
  "jsxSingleQuote": true,
  "endOfLine": "lf"
}
```

**`commitlint.config.ts`** (new)

- **Description:** Commitlint configuration enforcing Conventional Commits types and header/body length rules.

```ts
import type { UserConfig } from '@commitlint/types'

const Configuration: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'subject-case': [0],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 100],
  },
}

export default Configuration
```

**`package.json`** (partial — updated sections)

- **Description:** Adds Husky `prepare` hook, formatting scripts, `lint-staged` tasks, and devDependencies for commitlint, husky, lint-staged, and Prettier.

```diff
@@
  "scripts": {
    "dev": "next dev",
    "build": "next build",
-    "start": "next start"
+    "start": "next start",
+    "lint": "next lint",
+    "lint:divider": "node utils/normalize-divider-comments.mjs",
+    "format": "prettier --write",
+    "format:check": "prettier --check",
+    "format:all": "prettier --write \"**/*.{js,jsx,ts,tsx}\"",
+    "prepare": "husky"
  },
+  "lint-staged": {
+    "*.{js,jsx,ts,tsx,mjs,mts}": [
+      "prettier --write",
+      "node utils/normalize-divider-comments.mjs"
+    ],
+    "*.{json,md,css}": [
+      "prettier --write"
+    ]
+  },
@@
  "devDependencies": {
+    "@commitlint/cli": "^20.1.0",
+    "@commitlint/config-conventional": "^20.0.0",
    "@tailwindcss/postcss": "^4",
    "@types,node": "^20",
    "@types,react": "^19",
    "@types,react-dom": "^19",
+    "eslint": "^9.39.1",
+    "husky": "^9.1.7",
+    "lint-staged": "^16.2.7",
+    "prettier": "^3.7.1",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
```

**`utils/normalize-divider-comments.mjs`** (new)

- **Description:** CLI utility that normalizes divider-style comments to a uniform width across files.

```js
import fs from 'fs'
import path from 'path'

const TARGET_LENGTH = 64

/* ------------------------- helpers -------------------------- */

function isTargetLine(line) {
  return (
    (line.startsWith('/*-') && line.endsWith('-*/')) || // plain comment
    (line.startsWith('{/*-') && line.endsWith('-*/}') && line.includes('*/}')) // TSX comment
  )
}

function normalizeLine(line) {
  // strip outer markers and surrounding dashes / spaces
  const inner = line
    .replace(/^\{\/\*\s*-+/, '') // TSX opening
    .replace(/^\/\*\s*-+/, '') // plain opening
    .replace(/-+\s*\*\/\}$/, '') // TSX closing
    .replace(/-+\s*\*\/$/, '') // plain closing
    .trim()

  const body = ` ${inner} `
  const side = Math.max(0, TARGET_LENGTH - body.length - 4) // 4 = "/*" + " */"
  const left = Math.floor(side / 2)
  const right = side - left

  // restore the braces if the original line had them
  const open = line.startsWith('{') ? '{' : ''
  const close = line.endsWith('}') ? '}' : ''

  return `${open}/*${'-'.repeat(left)}${body}${'-'.repeat(right)}*/${close}`
}

/* ----------------------- file system ------------------------ */

function walk(dir, cb) {
  const stat = fs.statSync(dir)
  if (stat.isFile()) return cb(dir)

  fs.readdirSync(dir).forEach((ent) => {
    const full = path.join(dir, ent)
    walk(full, cb)
  })
}

function processFile(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  let changed = false

  const out = lines.map((raw) => {
    const trimmed = raw.trimStart()
    if (!isTargetLine(trimmed)) return raw

    const prefix = raw.slice(0, raw.length - trimmed.length) // keep indentation
    const updated = normalizeLine(trimmed)
    changed = true
    return prefix + updated
  })

  if (changed) {
    fs.writeFileSync(filePath, out.join('\n'), 'utf8')
    console.log(`✔  ${filePath}`)
  }
}

/* --------------------------- cli ---------------------------- */
// Get all arguments starting from index 2
const targets = process.argv.slice(2)

if (targets.length === 0) {
  console.error('Usage: node fix-dividers.mjs <file-or-folder> [more-files...]')
  process.exit(1)
}

// Iterate over every target provided
targets.forEach((target) => {
  walk(path.resolve(target), processFile)
})

console.log('\nDone.')
```

1.  **Commitlint Configuration:**
    - A `commitlint.config.ts` file has been added to configure the rules for `commitlint`. It extends the conventional config and specifies allowed commit types (`feat`, `fix`, `docs`, etc.), case rules, and length limits for the commit message header and body.

2.  **Prettier Configuration:**
    - A `.prettierrc` file has been added to define the code formatting rules for Prettier. This ensures a consistent code style across the entire codebase, regardless of the developer's local editor settings. The rules cover aspects like print width, trailing commas, tab width, and the use of semicolons and single quotes.

3.  **Lint-Staged Configuration:**
    - The `package.json` file now includes a `lint-staged` configuration. This specifies which commands to run on staged files for different file types. For JavaScript/TypeScript files, it runs Prettier to format the code and the new `normalize-divider-comments.mjs` script. For JSON, Markdown, and CSS files, it only runs Prettier.

4.  **NPM Scripts and Dependencies:**
    - The `package.json` file has been updated with several new scripts:
      - `lint`, `lint:divider`, `format`, `format:check`, `format:all`: These scripts provide manual control over linting and formatting.
      - `prepare`: This script runs `husky` to install the Git hooks when dependencies are installed.
    - New development dependencies have been added: `@commitlint/cli`, `@commitlint/config-conventional`, `eslint`, `husky`, `lint-staged`, and `prettier`.

5.  **Divider Comment Normalization Script:**
    - A new utility script, `utils/normalize-divider-comments.mjs`, has been introduced. This script scans files and standardizes the length of divider comments (e.g., `/*----------- comment -----------*/`), which is a unique and specific formatting rule to maintain a clean and organized visual structure in the code.

### Impact on the Codebase

This commit has a significant and positive impact on the development workflow and the overall quality of the codebase:

- **Improved Consistency:** Automated formatting and linting ensure that all code contributed to the project is consistent in style and quality.
- **Better Collaboration:** Standardized commit messages and branch naming conventions make it easier for team members to understand the purpose of changes and track work.
- **Early Error Detection:** Running checks before committing and pushing helps to catch errors and style violations early in the development process.
- **Enhanced Maintainability:** A clean, consistent, and well-documented codebase is easier to maintain and extend in the long run.

Developers working on this project will now need to adhere to the new conventions. The automated checks will guide them in this process, leading to a more streamlined and efficient workflow.

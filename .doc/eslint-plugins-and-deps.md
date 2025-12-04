# Whole `eslint.config.mts` file

```typescript
import eslint from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import { configs as tseslintConfigs } from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import globals from 'globals'
import sonarjs from 'eslint-plugin-sonarjs'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import reactHooks from 'eslint-plugin-react-hooks'
import reactPlugin from 'eslint-plugin-react'
import eslintPluginNext from '@next/eslint-plugin-next'

export default defineConfig([
  // Global ignores
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'utils/normalize-divider-comments.mjs',
  ]),

  // JavaScript/JSX files
  {
    name: 'javascript',
    files: ['**/*.{js,mjs,cjs,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      'import/resolver': { node: true },
      react: { version: 'detect' },
    },
    extends: [
      eslint.configs.recommended,
      importPlugin.flatConfigs.recommended,
      jsxA11y.flatConfigs.recommended,
      sonarjs.configs.recommended,
      eslintPluginUnicorn.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactPlugin.configs.flat.recommended,
      reactPlugin.configs.flat['jsx-runtime'],
      eslintPluginNext.configs['core-web-vitals'],
    ],
    rules: {
      // Import rules
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
        },
      ],
      'import/no-anonymous-default-export': 'warn',

      // React overrides
      'react/no-unknown-property': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-no-target-blank': 'off',

      // Accessibility tweaks (Next.js Image component)
      'jsx-a11y/alt-text': ['warn', { elements: ['img'], img: ['Image'] }],
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',
    },
  },

  // TypeScript/TSX files
  {
    name: 'typescript',
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
      react: { version: 'detect' },
    },
    extends: [
      eslint.configs.recommended,
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
      jsxA11y.flatConfigs.recommended,
      sonarjs.configs.recommended,
      eslintPluginUnicorn.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactPlugin.configs.flat.recommended,
      reactPlugin.configs.flat['jsx-runtime'],
      eslintPluginNext.configs['core-web-vitals'],
      ...tseslintConfigs.strictTypeChecked,
    ],
    rules: {
      // Same custom rules as JavaScript config
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
        },
      ],
      'import/no-anonymous-default-export': 'warn',
      'react/no-unknown-property': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-no-target-blank': 'off',
      'jsx-a11y/alt-text': ['warn', { elements: ['img'], img: ['Image'] }],
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',
    },
  },
])
```

# Configs parts

## Core ESLint

### Needed Packages

- `eslint`
- `jiti` (required for loading TypeScript configuration files like `eslint.config.mts` in Node.js)

### Config

```typescript
import eslint from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'

export default defineConfig([
  // Global ignores
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'utils/normalize-divider-comments.mjs',
  ]),

  // Base language options for JS files
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
  },

  // Base language options for TS files
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        ecmaFeatures: {
          jsx: true,
        },
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
  },
])
```

## TypeScript ESLint

### Needed Packages

- `typescript-eslint`

### Config

```typescript
import { configs as tseslintConfigs } from 'typescript-eslint'

// For TS files, add to extends:
tseslintConfigs.strictTypeChecked,
```

## eslint-plugin-import

### Needed Packages

- `eslint-plugin-import`
- `eslint-import-resolver-typescript`

### Config

```typescript
import importPlugin from 'eslint-plugin-import'

// For both JS and TS files, add to extends:
importPlugin.flatConfigs.recommended,

// For TS files only, add to extends:
importPlugin.flatConfigs.typescript,

// Add to settings for both:
{
  'import/resolver': {
    node: true,
  },
}

// For TS files, add to settings:
{
  'import/resolver': {
    typescript: true,
    node: true,
  },
}

// Add to rules:
{
  'import/order': [
    'warn',
    {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always',
    },
  ],
  'import/no-anonymous-default-export': 'warn',
}
```

## eslint-plugin-jsx-a11y

### Needed Packages

- `eslint-plugin-jsx-a11y`
- `@types/eslint-plugin-jsx-a11y`

### Config

```typescript
import jsxA11y from 'eslint-plugin-jsx-a11y'

// For both JS and TS files, add to extends:
jsxA11y.flatConfigs.recommended,
  // Add to rules:
  {
    'jsx-a11y/alt-text': [
      'warn',
      {
        elements: ['img'],
        img: ['Image'],
      },
    ],
    'jsx-a11y/aria-props': 'warn',
    'jsx-a11y/aria-proptypes': 'warn',
    'jsx-a11y/aria-unsupported-elements': 'warn',
    'jsx-a11y/role-has-required-aria-props': 'warn',
    'jsx-a11y/role-supports-aria-props': 'warn',
  })
```

## eslint-plugin-sonarjs

### Needed Packages

- `eslint-plugin-sonarjs`

### Config

```typescript
import sonarjs from 'eslint-plugin-sonarjs'

// For both JS and TS files, add to extends:
sonarjs.configs.recommended,
```

## eslint-plugin-unicorn

### Needed Packages

- `eslint-plugin-unicorn`

### Config

```typescript
import eslintPluginUnicorn from 'eslint-plugin-unicorn'

// For both JS and TS files, add to extends:
eslintPluginUnicorn.configs.recommended,
```

## eslint-plugin-react-hooks

### Needed Packages

- `eslint-plugin-react-hooks`

### Config

```typescript
import reactHooks from 'eslint-plugin-react-hooks'

// For both JS and TS files, add to extends:
reactHooks.configs.flat['recommended-latest'],
```

## eslint-plugin-react

### Needed Packages

- `eslint-plugin-react`

### Config

```typescript
import reactPlugin from 'eslint-plugin-react'

// For both JS and TS files, add to extends:
reactPlugin.configs.flat.recommended,
reactPlugin.configs.flat['jsx-runtime'],

// Add to settings for both:
{
  react: {
    version: 'detect',
  },
}

// Add to rules:
{
  'react/no-unknown-property': 'off',
  'react/react-in-jsx-scope': 'off',
  'react/prop-types': 'off',
  'react/jsx-no-target-blank': 'off',
}
```

## @next/eslint-plugin-next

### Needed Packages

- `@next/eslint-plugin-next`

### Config

```typescript
import eslintPluginNext from '@next/eslint-plugin-next'

// For both JS and TS files, add to extends:
eslintPluginNext.configs['core-web-vitals'],
```

## `Package.json` Scripts

Add these scripts to package.json:

```json
{
  "scripts": {
    "lint": "eslint",
    "lint:all": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

## Install Command

To install all the required packages, run:

```bash
npm install --save-dev eslint jiti typescript-eslint eslint-plugin-import eslint-import-resolver-typescript eslint-plugin-jsx-a11y @types/eslint-plugin-jsx-a11y eslint-plugin-sonarjs eslint-plugin-unicorn eslint-plugin-react-hooks eslint-plugin-react @next/eslint-plugin-next
```

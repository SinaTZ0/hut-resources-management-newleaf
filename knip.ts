import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  include: ['files', 'exports', 'types', 'nsExports', 'nsTypes', 'dependencies', 'devDependencies'],
  drizzle: false,
  ignore: [
    'next-env.d.ts',
    'drizzle.config.ts',
    'lib/drizzle/migrations/**/*',
    'lib/drizzle/schema.ts',
    'test.mjs',
    'test-output.js',
    'components/ui/**/*', // Ignoring shadcn components
    'eslint.commit.config.mts',
    'hooks/use-mobile.ts',
    'lib/env/typesafe-env.ts',
    'utils/normalize-divider-comments.mjs',
  ],
  ignoreDependencies: [
    'postcss',
    'drizzle-kit',
    'uipro-cli',

    // Radix UI primitives used in ignored shadcn components
    '@radix-ui/*',

    // Other dependencies hidden inside shadcn components
    'embla-carousel-react',
    'input-otp',
    'react-resizable-panels',
    'recharts',
    'vaul',
  ],
  ignoreExportsUsedInFile: {
    interface: true,
    type: true,
  },
  paths: {
    '@/*': ['./*'],
  },
  typescript: {
    config: 'tsconfig.json',
  },
}

export default config

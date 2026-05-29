import { defineConfig } from '@lingui/cli'
import { formatter } from '@lingui/format-po'

export default defineConfig({
  sourceLocale: 'en-US',
  locales: ['en-US'],
  fallbackLocales: {
    default: 'en-US',
  },
  format: formatter({
    lineNumbers: false,
  }),
  catalogs: [
    {
      path: '<rootDir>/packages/glowminds-resume/locales/{locale}',
      include: ['packages/glowminds-resume/src'],
    },
  ],
})

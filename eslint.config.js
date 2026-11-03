import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import boundaries from 'eslint-plugin-boundaries'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '*.tsbuildinfo'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    settings: {
      react: { version: 'detect' },
      'import/resolver': { typescript: { project: './tsconfig.json' } },
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**' },
        { type: 'feature', pattern: 'src/features/*', capture: ['name'] },
        { type: 'shared', pattern: 'src/shared/**' },
        { type: 'domain', pattern: 'src/domain/**' },
        { type: 'interfaces', pattern: 'src/interfaces/**' },
      ],
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      boundaries,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'jsx-a11y/aria-role': ['error', { ignoreNonDOM: true }],
      'react-hooks/set-state-in-effect': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            { from: { element: { type: 'domain' } }, allow: { to: { element: { type: ['domain', 'shared', 'interfaces'] } } } },
            { from: { element: { type: 'shared' } }, allow: { to: { element: { type: ['shared', 'domain', 'interfaces'] } } } },
            { from: { element: { type: 'feature' } }, allow: { to: { element: { type: ['shared', 'domain', 'feature', 'interfaces'] } } } },
            { from: { element: { type: 'app' } }, allow: { to: { element: { type: ['app', 'feature', 'shared', 'domain', 'interfaces'] } } } },
            { from: { element: { type: 'interfaces' } }, allow: { to: { element: { type: ['interfaces', 'domain', 'shared', 'feature'] } } } },
          ],
        },
      ],
    },
  },
  {
    files: ['src/shared/auth/AuthContext.tsx', 'src/shared/theme/design.tsx', 'src/shared/i18n/i18n.tsx', 'src/shared/theme/theme.tsx', 'src/shared/ui/Dialogs.tsx', 'src/features/tools/components/ListDialog.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { globals: globals.node, sourceType: 'commonjs' },
  },
)

import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import { fixupConfigRules } from '@eslint/compat'
import globals from 'globals'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import prettierPlugin from 'eslint-plugin-prettier'
import jestPlugin from 'eslint-plugin-jest'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
})

export default [
  // Global ignores (replaces .eslintignore)
  {
    ignores: [
      'node_modules/**',
      'build/**',
      'dist/**',
      'coverage/**',
      '*.config.js',
      '!eslint.config.js',
      // Disabled test files (intentionally not using .test.js pattern)
      '**/*.t_est.js',
    ],
  },

  // Base JS recommended config
  js.configs.recommended,

  // Airbnb config via FlatCompat (without hooks - we'll use v5 react-hooks directly)
  ...fixupConfigRules(compat.extends('airbnb')),

  // Prettier config (must come after airbnb to override conflicting rules)
  ...fixupConfigRules(compat.extends('prettier')),

  // React Hooks v7 flat config (replaces airbnb/hooks)
  reactHooksPlugin.configs.flat['recommended-latest'],

  // Main configuration for all JS/JSX files
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx'],
        },
      },
    },
    rules: {
      // Prettier integration
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],

      // React hooks - upgrade to error (recommended-latest sets warn)
      'react-hooks/exhaustive-deps': 'error',

      // React rules
      'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
      'react/react-in-jsx-scope': 'off',
      'react/require-default-props': 'off',
      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'arrow-function',
        },
      ],
      'react/prop-types': 'off',

      // Import rules
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          jsx: 'never',
        },
      ],
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: true,
        },
      ],

      // General rules
      'no-plusplus': 0,
      'no-console': 'warn',
      'no-param-reassign': [
        'error',
        {
          props: true,
          ignorePropertyModificationsFor: ['state'],
        },
      ],
      'no-unused-vars': 'off',
      'no-shadow': 'off',
    },
  },

  // Jest configuration for test files
  {
    files: ['**/*.test.js', '**/*.test.jsx'],
    plugins: {
      jest: jestPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
      'react/jsx-props-no-spreading': 'off',
    },
  },

  // Vite config file overrides
  {
    files: ['vite.config.js'],
    rules: {
      'import/no-unresolved': 'off',
      'import/no-extraneous-dependencies': 'off',
    },
  },
]

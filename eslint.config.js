import js from '@eslint/js'
import vitest from '@vitest/eslint-plugin'
import prettier from 'eslint-plugin-prettier'

export default [
  js.configs.recommended,
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/*.json']
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly'
      }
    },
    plugins: {
      prettier
    },
    rules: {
      camelcase: 'off',
      'no-console': 'off',
      'no-unused-vars': 'off',
      'prettier/prettier': 'error',
      semi: 'off'
    }
  },
  {
    files: ['__tests__/**/*.js', '**/*.test.js'],
    plugins: {
      vitest,
      prettier
    },
    rules: {
      ...vitest.configs.recommended.rules,
      'prettier/prettier': 'error'
    }
  }
]

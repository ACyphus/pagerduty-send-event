const babelParser = require('@babel/eslint-parser')
const jest = require('eslint-plugin-jest')
const prettier = require('eslint-plugin-prettier')
const js = require('@eslint/js')

module.exports = [
  js.configs.recommended,
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/*.json']
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          babelrc: false,
          configFile: false,
          presets: ['jest']
        }
      },
      globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'writable',
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
    languageOptions: {
      globals: {
        ...jest.environments.globals.globals
      }
    },
    plugins: {
      jest,
      prettier
    },
    rules: {
      ...jest.configs.recommended.rules,
      'prettier/prettier': 'error'
    }
  }
]

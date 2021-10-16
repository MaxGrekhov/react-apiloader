module.exports = {
  ignorePatterns: ['.eslintrc.js', 'webpack.config.js', '/lib/'],
  extends: [
    //base
    'eslint:recommended',
    //ts
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    //react
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    //promise
    'plugin:promise/recommended',
    //jsx
    'plugin:jsx-a11y/recommended',
    //prettier
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'import', 'jsx-a11y', 'react', 'react-hooks'],
  env: {
    browser: true,
    es6: true,
  },
  rules: {
    //core
    'no-restricted-imports': ['error', { patterns: ['../*'] }],
    //react
    'react/prop-types': 'off',
    'react/display-name': 'off',
    //typescript
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    //import
    'import/first': 'error',
    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        groups: [
          'builtin',
          'external',
          'internal',
          'unknown',
          'parent',
          'sibling',
          'index',
          'object',
        ],
        pathGroups: [{ pattern: '@/**', group: 'internal' }],
        pathGroupsExcludedImportTypes: [],
        alphabetize: { order: 'asc', caseInsensitive: false },
      },
    ],
    'import/no-default-export': 'error',
    'import/no-useless-path-segments': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'error',
    //jsx
    'jsx-a11y/no-onchange': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'jsx-a11y/no-autofocus': 'off',
  },
  settings: {
    react: {
      pragma: 'React',
      version: 'detect',
    },
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
};

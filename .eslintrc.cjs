// eslint-disable-next-line @typescript-eslint/no-require-imports
const { configs: tsConfigs } = require('@typescript-eslint/eslint-plugin')

const eslintRules = {
  'no-constructor-return': 'error',
  'no-duplicate-imports': 'error',
  'no-new-native-nonconstructor': 'error',
  'no-unused-private-class-members': 'error',
  'block-scoped-var': 'error',
  camelcase: ['error', { allow: ['status_code'] }],
  curly: ['error', 'multi-line'],
  'default-case': 'error',
  'default-case-last': 'error',
  eqeqeq: 'error',
  'no-caller': 'error',
  'no-console': 'error',
  'no-empty-static-block': 'error',
  'no-eq-null': 'error',
  'no-eval': 'error',
  'no-extend-native': 'error',
  'no-extra-bind': 'error',
  'no-floating-decimal': 'error',
  'no-implicit-globals': 'error',
  'no-lonely-if': 'error',
  'no-multi-assign': 'error',
  'no-new': 'error',
  'no-new-func': 'error',
  'no-new-object': 'error',
  'no-new-wrappers': 'error',
  'no-param-reassign': 'error',
  'no-return-assign': 'error',
  'no-sequences': 'error',
  'no-unneeded-ternary': 'error',
  'no-useless-call': 'error',
  'no-useless-computed-key': 'error',
  'no-useless-concat': 'error',
  'no-useless-constructor': 'error',
  'no-useless-return': 'error',
  'no-var': 'error',
  'object-shorthand': 'error',
  'one-var-declaration-per-line': 'error',
  'prefer-const': 'error',
  'prefer-rest-params': 'error',
  'prefer-spread': 'error',
  'prefer-template': 'error',
  'require-await': 'error',
  'require-unicode-regexp': 'error',
  'eol-last': 'error',
  'linebreak-style': 'error',
  quotes: [
    'error',
    'single',
    { avoidEscape: true, allowTemplateLiterals: false },
  ],
  'import/extensions': [
    'error',
    'never',
    {
      json: 'always',
      css: 'always',
      scss: 'always',
      vue: 'always',
    },
  ],
}

const tslintEslintRecommendedRules =
  tsConfigs?.['eslint-recommended']?.rules || {}
const tslintStrictRules = tsConfigs?.strict?.rules || {}
const typescriptRules = {
  ...tslintEslintRecommendedRules,
  ...tslintStrictRules,
  '@typescript-eslint/consistent-type-exports': [
    'error',
    { fixMixedExportsWithInlineTypeSpecifier: false },
  ],
  '@typescript-eslint/consistent-type-imports': [
    'error',
    {
      prefer: 'type-imports',
      fixStyle: 'inline-type-imports',
    },
  ],
  '@typescript-eslint/no-import-type-side-effects': 'error',
  'class-methods-use-this': 'off',
  '@typescript-eslint/class-methods-use-this': 'error',
  'dot-notation': 'off',
  '@typescript-eslint/dot-notation': 'error',
  'no-empty-function': 'off',
  'no-implied-eval': 'off',
  '@typescript-eslint/no-implied-eval': 'error',
  'no-invalid-this': 'off',
  '@typescript-eslint/no-invalid-this': 'error',
  'no-loss-of-precision': 'off',
  '@typescript-eslint/no-loss-of-precision': 'error',
  'no-unused-expressions': 'off',
  '@typescript-eslint/no-unused-expressions': 'error',
  'no-unused-vars': 'off',
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      ignoreRestSiblings: true,
      argsIgnorePattern: '^_',
    },
  ],
  'no-use-before-define': 'off',
  '@typescript-eslint/no-use-before-define': 'error',
  'no-shadow': 'off',
  '@typescript-eslint/no-shadow': 'error',
  '@typescript-eslint/no-explicit-any': 'off',
}

const vueRules = {
  'vue/html-self-closing': ['error', { html: { void: 'always' } }],
  'vue/no-v-html': 'error',
  'vue/attributes-order': 'error',
  'vue/singleline-html-element-content-newline': 'off',
  'vue/max-attributes-per-line': 'off',
  'vue/require-default-prop': 'off',
  'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
  'vue/block-tag-newline': 'error',
  'vue/custom-event-name-casing': 'error',
  'vue/define-emits-declaration': 'error',
  'vue/define-macros-order': 'error',
  'vue/define-props-declaration': 'error',
  'vue/html-button-has-type': 'error',
  'vue/component-api-style': 'error',
  'vue/no-undef-components': 'error',
  'vue/no-required-prop-with-default': 'off',
  'vue/html-closing-bracket-newline': 'off',
}

const getImportRules = ({ unusedExports, ignoreExports = [] }) => ({
  'import/no-useless-path-segments': [
    'error',
    {
      noUselessIndex: true,
    },
  ],
  'import/no-unused-modules': [
    unusedExports ? 'error' : 'off',
    { unusedExports, ignoreExports },
  ],
  'import/no-duplicates': [
    'error',
    { considerQueryString: true, 'prefer-inline': true },
  ],
  'import/consistent-type-specifier-style': 'off',
  'import/first': 'error',
  'import/no-named-as-default-member': 'off',
})

const tsconfigFiles = ['./tsconfig.json', './src/app/tsconfig.json']
const rootTsconfig = ['./tsconfig.json']
const appTsconfig = ['./src/app/tsconfig.json']

module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'prettier',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  plugins: ['@typescript-eslint', 'import', 'vue'],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    extraFileExtensions: ['.vue'],
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: tsconfigFiles,
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: tsconfigFiles,
        noWarnOnMultipleProjects: true,
      },
      node: true,
    },
    'import/extensions': [
      '.js',
      '.cjs',
      '.mjs',
      '.d.ts',
      '.ts',
      '.mts',
      '.cts',
      '.vue',
      '.json',
    ],
    'import/ignore': ['.vue'],
    vue: {
      version: 'detect',
    },
  },
  ignorePatterns: [
    'node_modules',
    'dist',
    'build',
    'coverage',
    '.DS_Store',
    '*.local',
    'src/db/migrations/',
    'types/**/*.d.ts',
  ],
  rules: {
    ...eslintRules,
    ...getImportRules({ unusedExports: false, ignoreExports: [] }),
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  },
  overrides: [
    {
      files: ['**/*.vue'],
      parser: 'vue-eslint-parser',
      env: {
        browser: true,
      },
      globals: {
        __APP_VERSION__: 'readonly',
      },
      extends: ['plugin:vue/recommended'],
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.vue'],
      },
      rules: {
        ...typescriptRules,
        ...vueRules,
        'import/no-default-export': 'off',
        'import/default': 'off',
      },
    },
    {
      files: ['src/app/**/*.ts', 'src/app/**/*.mts', 'src/app/**/*.cts'],
      env: { browser: true, es2023: true },
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: appTsconfig,
      },
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        ...typescriptRules,
        'import/no-default-export': 'off',
      },
    },
    {
      files: ['src/**/*.ts', 'src/**/*.mts', 'src/**/*.cts', '!src/app/**/*'],
      env: { node: true, es2023: true },
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: rootTsconfig,
      },
      extends: ['plugin:@typescript-eslint/recommended'], // And here
      rules: {
        ...typescriptRules,
      },
    },
    {
      files: [
        '*.config.js',
        '*.config.cjs',
        '*.config.mjs',
        '*.config.ts',
        '*.config.mts',
        '*.config.cts',
        'drizzle.config.ts',
        'vite.config.ts',
        'vitest.config.ts',
        '.eslintrc.cjs',
        '.prettierrc.json',
      ],
      env: { node: true, es2023: true },
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: rootTsconfig,
        sourceType: 'module',
      },
      rules: {
        ...typescriptRules,
        'import/no-default-export': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        'no-console': 'off',
      },
    },
    {
      files: ['bin/**/*.js'],
      env: { node: true, es2023: true },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'no-console': 'off',
      },
    },
    {
      files: ['*.cjs'],
      env: { node: true, es2023: true },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
}

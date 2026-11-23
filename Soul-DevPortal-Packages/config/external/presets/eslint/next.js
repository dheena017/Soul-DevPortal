import reactConfig from './react.js';

/** @type {import('eslint').Linter.Config} */
export default {
  ...reactConfig,
  plugins: [...reactConfig.plugins, '@next/next'],
  extends: [
    ...reactConfig.extends,
    'plugin:@next/next/recommended',
    'plugin:@next/next/core-web-vitals',
  ],
  rules: {
    ...reactConfig.rules,
    '@next/next/no-html-link-for-pages': 'off',
  },
};

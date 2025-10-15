module.exports = {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-order'],
  rules: {
    'color-hex-length': 'short',
    'order/properties-order': [],
  },
  ignoreFiles: ['**/dist/**', '**/build/**', '**/coverage/**', '**/node_modules/**'],
};

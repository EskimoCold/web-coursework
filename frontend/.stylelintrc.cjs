module.exports = {
  extends: ["stylelint-config-standard", "stylelint-config-prettier"],
  plugins: ["stylelint-order"],
  rules: {
    "color-hex-length": "short",
    "order/properties-order": []
  },
  ignoreFiles: ["**/dist/**", "**/build/**", "**/coverage/**", "**/node_modules/**"]
};

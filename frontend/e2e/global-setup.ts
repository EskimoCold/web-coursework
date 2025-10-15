export default async () => {
  // Ensure Playwright's expect is isolated by avoiding importing project expect in E2E context
  // No-op setup keeps config modular and resolves matcher redefinition in some environments
};

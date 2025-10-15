import { test, expect } from "@playwright/test";

test("loads Home and interacts with Counter", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Mock Frontend" })).toBeVisible();

  const inc = page.getByRole("button", { name: "increment" });
  const dec = page.getByRole("button", { name: "decrement" });
  const value = page.getByTestId("count");

  await inc.click();
  await expect(value).toHaveText("1");
  await dec.click();
  await expect(value).toHaveText("0");

  await expect(page.getByRole("heading", { name: "Todos" })).toBeVisible();
  await expect(page.getByRole("list", { name: "todo-list" })).toBeVisible();
  await expect(page.getByText("Buy coffee beans")).toBeVisible();
});

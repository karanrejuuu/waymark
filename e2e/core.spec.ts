import { test, expect } from "@playwright/test";

test.describe("Waymark Core User Flows", () => {
  test("loads the Today page with demo shops and allows expanding a shop row", async ({ page }) => {
    await page.goto("/");

    // 1. Title is "Today"
    await expect(page.getByRole("heading", { name: "Today", level: 1 })).toBeVisible();

    // 2. Demo shops should load into the list
    const shopRow = page.getByText("Gupta Kirana & General Store");
    await expect(shopRow).toBeVisible({ timeout: 10000 });

    // 3. Click row to expand inline details
    await shopRow.click();

    // 4. Products section should be visible
    await expect(page.getByText("Products to deliver:")).toBeVisible();
    await expect(page.getByRole("button", { name: "Mark delivered" })).toBeVisible();
  });

  test("can navigate to Routes page and search for a shop", async ({ page }) => {
    await page.goto("/routes");

    // Check heading
    await expect(page.getByRole("heading", { name: "Routes", level: 1 })).toBeVisible();

    // Search for a specific shop
    const searchInput = page.getByPlaceholder("Search by shop name...");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Gupta");

    // Only matching shop should appear
    await expect(page.getByText("Gupta Kirana & General Store")).toBeVisible();
    await expect(page.getByText("Bharat Daily Needs")).not.toBeVisible();
  });

  test("can view shop details and properties", async ({ page }) => {
    await page.goto("/routes");
    const shopLink = page.getByRole("link", { name: /Gupta Kirana/i });
    await expect(shopLink).toBeVisible({ timeout: 10000 });
    await shopLink.click();

    // Shop detail heading
    await expect(page.getByRole("heading", { name: "Gupta Kirana & General Store", level: 1 })).toBeVisible();
    await expect(page.getByText("Products", { exact: true })).toBeVisible();
    await expect(page.getByText("Delivery History")).toBeVisible();
  });

  test("settings page displays vehicle and fuel parameters", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings", level: 1 })).toBeVisible();
    await expect(page.getByText("Average Mileage")).toBeVisible();
    await expect(page.getByText("Fuel Price")).toBeVisible();
  });
});

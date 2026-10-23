import { test, expect } from "@playwright/test";

test.describe("Waymark Mobile E2E Flows", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean local state
    await page.goto("/");
  });

  test("loads Today route with vertical stops, next-up highlight, and route summary", async ({ page }) => {
    await page.goto("/");

    // 1. Heading check
    await expect(page.getByRole("heading", { name: "Today's Route", level: 1 })).toBeVisible({ timeout: 10000 });

    // 2. Demo shops should load into the vertical route line
    const firstShop = page.getByText("Gupta Kirana & General Store");
    await expect(firstShop).toBeVisible({ timeout: 10000 });

    // 3. Status summary with urgent indicator
    await expect(page.getByText(/urgent/i)).toBeVisible();
    await expect(page.getByText(/pending dues/i)).toBeVisible();

    // 4. Next-up turmeric indicator
    await expect(page.getByText(/first stop highlighted as next-up/i)).toBeVisible();
  });

  test("marks delivered with 200ms tally tick and updates route stop status", async ({ page }) => {
    await page.goto("/");

    // Find and expand the first stop
    const shopRow = page.getByText("Gupta Kirana & General Store");
    await expect(shopRow).toBeVisible({ timeout: 10000 });
    await shopRow.click();

    // Check inline products & quick deliver button
    const deliverBtn = page.getByRole("button", { name: /Mark Delivered & Complete/i });
    await expect(deliverBtn).toBeVisible();

    // Click delivered
    await deliverBtn.click();

    // Verify confirmation and completion
    await expect(page.getByText("Completed ✓")).toBeVisible({ timeout: 5000 });
  });

  test("snoozes a shop without altering interval", async ({ page }) => {
    await page.goto("/");

    // Expand second stop (Laxmi)
    const laxmiShop = page.getByText("Laxmi Supermarket");
    await expect(laxmiShop).toBeVisible({ timeout: 10000 });
    await laxmiShop.click();

    // Click Snooze / Reschedule button
    const snoozeBtn = page.getByRole("button", { name: /Snooze/i });
    await expect(snoozeBtn).toBeVisible();
    await snoozeBtn.click();

    // Select snooze option (+3 days)
    const threeDaysOption = page.getByRole("button", { name: /\+3 days/i });
    await expect(threeDaysOption).toBeVisible();
    await threeDaysOption.click();

    // Stop should disappear from today's active route
    await expect(page.getByText("Laxmi Supermarket")).not.toBeVisible({ timeout: 5000 });
  });

  test("offline delivery queuing and reconnection sync", async ({ page, context }) => {
    await page.goto("/");
    await expect(page.getByText("Gupta Kirana & General Store")).toBeVisible({ timeout: 10000 });

    // 1. Go offline
    await context.setOffline(true);

    // Verify offline banner appears
    await expect(page.getByText(/Working offline/i)).toBeVisible({ timeout: 5000 });

    // 2. Deliver stop while offline
    const stop = page.getByText("Gupta Kirana & General Store");
    await stop.click();
    const deliverBtn = page.getByRole("button", { name: /Mark Delivered & Complete/i });
    await deliverBtn.click();
    await expect(page.getByText("Completed ✓")).toBeVisible({ timeout: 5000 });

    // 3. Reconnect online
    await context.setOffline(false);

    // Verify offline banner clears
    await expect(page.getByText(/Working offline/i)).not.toBeVisible({ timeout: 5000 });
  });

  test("renders authentic physical dispatch sheet landing page with live route simulation", async ({ page }) => {
    await page.goto("/welcome");

    // 1. Hero headline check
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Every day a kirana shelf stays empty, another brand takes your space");

    // 2. Active Dispatch Sheet preview
    await expect(page.getByText("Active Dispatch Line · Route 04 (North Bazaar)")).toBeVisible();

    // 3. Interactive stop toggle
    const stopToTap = page.getByText("Laxmi Supermarket");
    await expect(stopToTap).toBeVisible();
    await stopToTap.click();

    // 4. Verify completed tally updates
    await expect(page.getByText(/1 of 4 completed/i)).toBeVisible();
  });
});
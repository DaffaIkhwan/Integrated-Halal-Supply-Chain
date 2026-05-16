import { test, expect } from '@playwright/test';

test.describe('KMS-DSS Halal Supply Chain E2E', () => {
  test('should load the dashboard rekap aktual', async ({ page }) => {
    await page.goto('/dashboard/rekap-aktual');
    
    // Expect the header to be visible
    await expect(page.locator('h1')).toContainText('Rekap Kuesioner 3');
    
    // Check if the filters and search are visible
    await expect(page.getByPlaceholder('Cari nama, instansi, email...')).toBeVisible();
  });
  
  test('should load the dashboard rekap risiko', async ({ page }) => {
    await page.goto('/dashboard/rekap-risiko');
    await expect(page.locator('h1')).toContainText('Rekap Kuesioner 2');
  });
});

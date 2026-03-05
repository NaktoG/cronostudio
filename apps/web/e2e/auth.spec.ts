import { test, expect } from '@playwright/test';

test('login page renders', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'CronoStudio' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Contraseña')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toBeVisible();
});

test.describe('authenticated', () => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  test.skip(!email || !password, 'E2E credentials not configured');

  test('login redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email as string);
    await page.getByLabel('Contraseña').fill(password as string);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  });
});

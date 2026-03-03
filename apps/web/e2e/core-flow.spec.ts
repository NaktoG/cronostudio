import { test, expect } from '@playwright/test';

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test.skip(!email || !password, 'E2E credentials not configured');

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  const submitLogin = async () => {
    await page.getByLabel('Email').fill(email as string);
    await page.getByLabel('Contraseña').fill(password as string);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  };

  await submitLogin();

  const errorBox = page.locator('form').getByText(/Por favor|Error|credenciales|incorrect|Too Many Requests/i);
  await Promise.race([
    page.getByRole('link', { name: 'Dashboard' }).waitFor({ timeout: 20000 }),
    errorBox.waitFor({ timeout: 20000 }),
  ]);

  if (await errorBox.isVisible()) {
    const errorText = (await errorBox.textContent())?.trim() || '';
    if (errorText.includes('Too Many Requests')) {
      await page.waitForTimeout(65000);
      await submitLogin();
      await Promise.race([
        page.getByRole('link', { name: 'Dashboard' }).waitFor({ timeout: 20000 }),
        errorBox.waitFor({ timeout: 20000 }),
      ]);
      if (await errorBox.isVisible()) {
        const retryText = (await errorBox.textContent())?.trim();
        throw new Error(`Login failed after retry. ${retryText || 'No error text found.'}`);
      }
      return;
    }

    throw new Error(`Login failed. ${errorText || 'No error text found.'}`);
  }
}

test.describe.serial('core flow', () => {
  test('create idea, script, thumbnail, and production', async ({ page }) => {
    test.setTimeout(240_000);

    const stamp = Date.now();
    const ideaTitle = `[E2E] Idea ${stamp}`;
    const scriptTitle = `[E2E] Guion ${stamp}`;
    const thumbnailTitle = `[E2E] Miniatura ${stamp}`;
    const productionTitle = `[E2E] Produccion ${stamp}`;

    await login(page);

    await page.goto('/ideas');
    await expect(page.locator('h2', { hasText: 'Ideas' })).toBeVisible();
    await page.getByRole('button', { name: 'Nueva Idea' }).first().click();
    const ideaDialog = page.getByRole('dialog');
    await expect(ideaDialog).toBeVisible();
    await ideaDialog.getByPlaceholder('Idea para video...').fill(ideaTitle);
    await ideaDialog.getByPlaceholder(/Promesa:/).fill('Idea creada por QA automatizado.');
    const useChannelButton = ideaDialog.getByRole('button', { name: 'Usar canal seleccionado' });
    if (await useChannelButton.count()) {
      await useChannelButton.click();
    }
    const priorityInput = ideaDialog.locator('input[type="number"]');
    if (await priorityInput.count()) {
      await priorityInput.fill('5');
    }
    const tagsInput = ideaDialog.getByPlaceholder('seo, video, tutorial');
    if (await tagsInput.count()) {
      await tagsInput.fill('e2e, qa');
    }
    const ideaCreateResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/ideas') && resp.request().method() === 'POST'
    );
    await ideaDialog.getByRole('button', { name: /Nueva Idea|Crear idea/ }).click();
    const ideaResponse = await ideaCreateResponse;
    if (!ideaResponse.ok()) {
      throw new Error(`Idea create failed: ${await ideaResponse.text()}`);
    }
    await expect(page.getByText(ideaTitle)).toBeVisible();

    await page.goto('/scripts');
    await expect(page.locator('h2', { hasText: 'Guiones' })).toBeVisible();
    await page.getByRole('button', { name: 'Nuevo guion' }).first().click();
    const scriptDialog = page.getByRole('dialog');
    await expect(scriptDialog).toBeVisible();
    const ideaTitleInput = scriptDialog.getByPlaceholder('Buscar por título');
    if (await ideaTitleInput.count()) {
      await ideaTitleInput.fill(ideaTitle);
    }
    await scriptDialog
      .locator('label', { hasText: 'Titulo' })
      .locator('..')
      .locator('input')
      .fill(scriptTitle);
    await scriptDialog.getByPlaceholder('Introduce el guion...').fill('Intro QA');
    await scriptDialog.getByPlaceholder('Desarrollo principal...').fill('Cuerpo QA');
    await scriptDialog.getByPlaceholder('Que accion quieres que tomen?').fill('CTA QA');
    await scriptDialog.getByPlaceholder('Cierre y despedida...').fill('Outro QA');
    const scriptCreateResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/scripts') && resp.request().method() === 'POST'
    );
    await scriptDialog.getByRole('button', { name: /Crear guion|Nuevo guion/ }).click();
    const scriptResponse = await scriptCreateResponse;
    if (!scriptResponse.ok()) {
      throw new Error(`Script create failed: ${await scriptResponse.text()}`);
    }
    await expect(page.getByText(scriptTitle)).toBeVisible();

    const scriptCard = page.locator('div.surface-panel', { hasText: scriptTitle }).first();
    await scriptCard.getByRole('button', { name: 'Eliminar' }).first().click();
    const scriptDeleteDialog = page.getByRole('dialog', { name: 'Eliminar guion' });
    await expect(scriptDeleteDialog).toBeVisible();
    await scriptDeleteDialog.getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByRole('heading', { name: scriptTitle })).toHaveCount(0);

    await page.goto('/ideas');
    await expect(page.locator('h2', { hasText: 'Ideas' })).toBeVisible();
    const ideaCard = page.locator('div.surface-panel', { hasText: ideaTitle }).first();
    await ideaCard.getByRole('button', { name: 'Eliminar' }).first().click();
    const ideaDeleteDialog = page.getByRole('dialog', { name: 'Eliminar idea' });
    await expect(ideaDeleteDialog).toBeVisible();
    await ideaDeleteDialog.getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByRole('heading', { name: ideaTitle })).toHaveCount(0);

    await page.goto('/thumbnails');
    await expect(page.locator('h2', { hasText: 'Miniaturas' })).toBeVisible();
    await page.getByRole('button', { name: 'Nueva Miniatura' }).first().click();
    const thumbDialog = page.getByRole('dialog');
    await expect(thumbDialog).toBeVisible();
    await thumbDialog.getByPlaceholder('Miniatura para video...').fill(thumbnailTitle);
    await thumbDialog.getByPlaceholder('https://.../thumbnail.png').fill(`https://picsum.photos/seed/${stamp}/640/360`);
    const thumbCreateResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/thumbnails') && resp.request().method() === 'POST'
    );
    await thumbDialog.getByRole('button', { name: /Crear miniatura|Nueva Miniatura/ }).click();
    const thumbResponse = await thumbCreateResponse;
    if (!thumbResponse.ok()) {
      throw new Error(`Thumbnail create failed: ${await thumbResponse.text()}`);
    }
    await expect(page.getByText(thumbnailTitle)).toBeVisible();

    const thumbCard = page.locator('div.surface-panel', { hasText: thumbnailTitle }).first();
    page.once('dialog', (dialog) => dialog.accept());
    await thumbCard.getByRole('button', { name: 'Eliminar' }).first().click();
    await expect(page.getByText(thumbnailTitle)).toHaveCount(0);

    await page.goto('/?new=1');
    const productionDialog = page.getByRole('dialog', { name: 'Nuevo contenido' });
    await expect(productionDialog).toBeVisible();
    await productionDialog.getByPlaceholder('Título del contenido...').fill(productionTitle);
    const productionCreateResponse = page.waitForResponse((resp) =>
      resp.url().includes('/api/productions') && resp.request().method() === 'POST'
    );
    await productionDialog.getByRole('button', { name: 'Crear contenido' }).click();
    const productionResponse = await productionCreateResponse;
    if (!productionResponse.ok()) {
      throw new Error(`Production create failed: ${await productionResponse.text()}`);
    }
    await expect(page.getByText(productionTitle).first()).toBeVisible();
  });
});

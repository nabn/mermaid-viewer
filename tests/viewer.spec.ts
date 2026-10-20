import { test, expect } from '@playwright/test';

const flowchart = 'flowchart LR\n  A[Hello] --> B[World]';

test('paste to preview, explicitly edit live, preserve last valid diagram, and restore draft', async ({ page }) => {
  await page.goto('/');
  const source = page.getByRole('textbox', { name: 'Mermaid diagram source' });
  await source.fill(flowchart);
  await expect(page.locator('#editor')).toBeHidden();
  await expect(page.locator('#diagram svg')).toBeVisible();
  await page.getByRole('button', { name: 'Edit source' }).click();
  await source.fill(flowchart.replace('World', 'Updated'));
  await expect(page.locator('#diagram')).toContainText('Updated');
  await expect(source).toBeVisible();
  await source.fill('not a diagram');
  await expect(page.locator('#error')).toBeVisible();
  await expect(page.locator('#diagram')).toContainText('Updated');
  await source.fill(flowchart);
  await expect(page.locator('#error')).toBeHidden();
  await page.reload();
  await expect(page.locator('#diagram')).toContainText('World');
  await expect(page.locator('#editor')).toBeHidden();
});

test('theme changes both UI and diagram and survives reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Flowchart' }).click();
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#diagram')).toHaveCSS('--pele-bg', '#1c221e');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

for (const name of ['Flowchart', 'Sequence', 'Mind map']) {
  test(`${name} example renders and exports a themed SVG`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name }).click();
    await expect(page.locator('#diagram svg')).toBeVisible();
    await expect(page.locator('#error')).toBeHidden();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export SVG' }).click();
    expect((await download).suggestedFilename()).toBe('diagram.svg');
  });
}

test('accepts fenced Mermaid and keyboard toggle', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox').fill('```mermaid\n' + flowchart + '\n```');
  await expect(page.locator('#editor')).toBeHidden();
  await page.keyboard.press('Control+Enter');
  await expect(page.getByRole('textbox')).toBeFocused();
});

test('works on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('textbox').fill(flowchart);
  await expect(page.locator('#diagram svg')).toBeVisible();
  await page.getByRole('button', { name: 'Edit source' }).click();
  await expect(page.getByRole('textbox')).toBeVisible();
  await expect(page.locator('#diagram svg')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

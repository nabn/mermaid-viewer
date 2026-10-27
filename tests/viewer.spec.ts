import { test, expect } from '@playwright/test';

const flowchart = 'flowchart LR\n  A[Hello] --> B[World]';

test('paste to preview, explicitly edit live, preserve last valid diagram, and start fresh on reload', async ({ page }) => {
  await page.goto('/');
  const source = page.getByRole('textbox', { name: 'Mermaid diagram source' });
  await source.fill(flowchart);
  await expect(page.locator('#editor')).toBeHidden();
  await expect(page.locator('#diagram svg')).toBeVisible();
  await page.getByRole('button', { name: 'Toggle source' }).click();
  await source.fill(flowchart.replace('World', 'Updated'));
  await expect(page.locator('#diagram')).toContainText('Updated');
  await expect(source).toBeVisible();
  await source.fill('not a diagram');
  await expect(page.locator('#error')).toBeVisible();
  await expect(page.locator('#diagram')).toContainText('Updated');
  await source.fill(flowchart);
  await expect(page.locator('#error')).toBeHidden();
  await page.reload();
  await expect(source).toHaveValue('');
  await expect(source).toBeVisible();
  await expect(page.locator('#diagram')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('meridian-source'))).toBeNull();
});

test('shows a minimal input and examples on desktop and mobile', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expect(page.getByText('Paste Mermaid syntax.', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Flowchart' })).toBeVisible();
  await expect(page.locator('header')).toHaveCount(1);
  await page.screenshot({ path: 'test-results/minimal-light.png', fullPage: true });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: 'test-results/minimal-dark.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Flowchart' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: 'test-results/minimal-mobile.png', fullPage: true });
});

test('legacy drafts are removed instead of restored', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('meridian-source', 'flowchart LR; A-->B'));
  await page.reload();
  await expect(page.getByRole('textbox')).toHaveValue('');
  expect(await page.evaluate(() => localStorage.getItem('meridian-source'))).toBeNull();
});

test('uses the device theme, responds to changes, and does not persist overrides', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Flowchart' }).click();
  await expect(page.locator('#diagram')).toHaveCSS('--pele-bg', '#111111');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('#diagram')).toHaveCSS('--pele-bg', '#ffffff');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
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

test('tall diagrams render inline and scroll with the page without a footer', async ({ page }) => {
  await page.goto('/');
  const tall = 'flowchart TD\n' + Array.from({ length: 30 }, (_, i) => `  N${i}[Step ${i}] --> N${i + 1}[Step ${i + 1}]`).join('\n');
  await page.getByRole('textbox').fill(tall);
  await expect(page.locator('#editor')).toBeHidden();
  const svg = page.locator('#diagram svg');
  await expect(svg).toBeVisible();
  const bounds = await svg.boundingBox();
  expect(bounds!.height).toBeGreaterThan(1000);
  await expect(page.locator('#workspace')).toHaveCSS('overflow', 'visible');
  await expect(page.locator('#diagram')).toHaveCSS('overflow', 'visible');
  await expect(page.locator('footer')).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

test('works on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('textbox').fill(flowchart);
  await expect(page.locator('#diagram svg')).toBeVisible();
  await page.getByRole('button', { name: 'Toggle source' }).click();
  await expect(page.getByRole('textbox')).toBeVisible();
  await expect(page.locator('#diagram svg')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

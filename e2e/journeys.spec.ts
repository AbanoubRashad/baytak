import { expect, test } from '@playwright/test';

/** Start each test in English with a clean browser (no remembered language, chat or saved homes). */
test.beforeEach(async ({ context }) => {
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', url: 'http://localhost' }]);
});

test('filter → compound → book a visit', async ({ page }) => {
  await page.goto('/units?area=new-cairo&sale=offplan');
  await expect(page.getByRole('heading', { level: 1, name: 'All homes' })).toBeVisible();

  // Filters come from the URL and stay there.
  await expect(page.getByRole('button', { name: 'New Cairo', pressed: true })).toBeVisible();
  await page.getByRole('button', { name: '2', exact: true }).click();
  await expect(page).toHaveURL(/beds=2/);

  // Open the first matching home, then its compound.
  await page.getByRole('link', { name: /Central Residence/ }).first().click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Central Residence');
  await page.getByRole('main').getByRole('link', { name: 'Hyde Park Central', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Hyde Park Central' })).toBeVisible();

  // Back to the home from the compound page and book a visit.
  await page.getByRole('link', { name: /Central Residence/ }).first().click();
  await page.getByRole('tab', { name: 'Book a visit' }).click();
  const panel = page.getByRole('tabpanel', { name: 'Book a visit' });
  await panel.getByRole('group', { name: 'Day' }).getByRole('button').first().click();
  await panel.getByRole('button', { name: /5:00\s?pm/i }).click();
  await panel.getByLabel('Your name').fill('E2E Tester');
  await panel.getByLabel('Mobile / WhatsApp').fill('010 1234 5678');
  await panel.getByRole('button', { name: 'Request this visit' }).click();

  await expect(panel.getByText(/See you/)).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Add to calendar' })).toBeVisible();
});

test('chat → a lead is created', async ({ page }) => {
  await page.goto('/compounds/east-vale');
  await page.getByRole('button', { name: /Ask Romany about East Vale/ }).click();

  const chat = page.getByRole('dialog', { name: 'Romany' });
  await expect(chat).toBeVisible();
  await expect(chat.getByLabel('Write a message…')).toHaveValue(/East Vale/);

  await chat.getByLabel(/Your name/).fill('E2E Tester');
  await chat.getByLabel(/Your mobile/).fill('01012345678');
  await chat.getByRole('button', { name: 'Send' }).click();

  // The message shows in the thread; with Supabase connected the lead is stored (no preview notice).
  await expect(chat.getByRole('list', { name: /Conversation with Romany/ })).toContainText('East Vale');
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    await expect(chat.getByText(/Preview mode/)).toHaveCount(0);
    await expect(chat.getByRole('button', { name: 'Start a new conversation' })).toBeVisible();
  }
});

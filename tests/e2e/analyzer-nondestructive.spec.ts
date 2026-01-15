import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: process.env.E2E_ENV_FILE || '.env.test' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL / SUPABASE_KEY) in your environment to run E2E tests.');
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

test.describe('Analyzer - non-destructive keyword match', () => {
  test('uses an existing client keyword to find a match', async ({ page, baseURL }) => {
    // Find an active client with at least one keyword
    const { data: clients } = await sb
      .from('clients')
      .select('id,name,client_keywords(keyword)')
      .eq('is_active', true)
      .limit(50);

    if (!clients || clients.length === 0) {
      test.skip('No active clients found');
      return;
    }

    const clientWithKeyword = clients.find((c: any) => (c.client_keywords || []).length > 0);
    if (!clientWithKeyword) {
      test.skip('No active clients with keywords found');
      return;
    }

    const keyword = clientWithKeyword.client_keywords[0].keyword;
    const clientName = clientWithKeyword.name;

    // Ensure dev mock auth and theme
    await page.addInitScript(() => {
      localStorage.setItem('dev:mockAuth', 'true');
      localStorage.setItem('theme', 'dark');
    });

    await page.goto(`${baseURL}/analyzer`);
    await page.waitForSelector('text=Content to Analyze');

    // Fill content and analyze
    await page.fill('textarea[placeholder*="Paste the content"]', `This post mentions ${keyword} and is relevant.`);
    await page.click('text=Quick Match (Keywords)');

    // Assert client appears
    await page.waitForSelector('text=Matching Clients');
    await expect(page.locator(`text=${clientName}`)).toBeVisible({ timeout: 10000 });
  });
});

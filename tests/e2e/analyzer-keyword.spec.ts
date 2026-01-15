import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
// Load .env.test automatically when present to provide Supabase keys for E2E runs
import dotenv from 'dotenv';
dotenv.config({ path: process.env.E2E_ENV_FILE || '.env.test' });

// Require environment variables for Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL / SUPABASE_KEY) in your environment to run E2E tests.');
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

test.describe('Analyzer - keyword match', () => {
  let orgId: string | null = null;
  let clientId: string | null = null;
  const testKeyword = `pw-test-kw-${Date.now()}`;
  const clientName = `PW Test Client ${Date.now()}`;

  test.beforeAll(async () => {
    // create an organization for isolation
    const { data: org, error: orgErr } = await sb
      .from('organizations')
      .insert({ name: `pw-org-${Date.now()}`, slug: `pw-org-${Date.now()}` })
      .select()
      .single();

    if (orgErr) throw orgErr;
    orgId = org.id;

    // create client
    const { data: client, error: clientErr } = await sb
      .from('clients')
      .insert({ organization_id: orgId, name: clientName, industry: 'Testing', description: 'E2E test', is_active: true })
      .select()
      .single();

    if (clientErr) throw clientErr;
    clientId = client.id;

    // add keyword
    const { error: kwErr } = await sb
      .from('client_keywords')
      .insert({ client_id: clientId, keyword: testKeyword });

    if (kwErr) throw kwErr;
  });

  test.afterAll(async () => {
    if (clientId) {
      await sb.from('client_keywords').delete().eq('client_id', clientId);
      await sb.from('clients').delete().eq('id', clientId);
    }
    if (orgId) {
      await sb.from('organizations').delete().eq('id', orgId);
    }
  });

  test('finds a matching client using Quick Match (Keywords)', async ({ page, baseURL }) => {
    // Ensure dev mock auth so UI renders
    await page.addInitScript(() => {
      localStorage.setItem('dev:mockAuth', 'true');
      localStorage.setItem('theme', 'dark');
    });

    await page.goto(`${baseURL}/analyzer`);

    // Wait for the page to be interactive
    await page.waitForSelector('text=Content to Analyze');

    // Paste content containing the keyword
    await page.fill('textarea[label="Content"]', `This post mentions ${testKeyword} and is relevant.`).catch(async () => {
      // Fallback: target by placeholder
      await page.fill('textarea[placeholder*="Paste the content"]', `This post mentions ${testKeyword} and is relevant.`);
    });

    // Click Quick Match (Keywords)
    await page.click('text=Quick Match (Keywords)');

    // Wait for results area and assert the client appears
    await page.waitForSelector('text=Matching Clients');
    await expect(page.locator(`text=${clientName}`)).toBeVisible({ timeout: 10000 });
  });
});

-- Demo seed for Maximus Engagimus
-- Run this in Supabase SQL Editor to create a demo org, link the current auth user, and add a client.
-- Replace the USER_ID below with your auth user's id if different.

-- NOTE: This is safe to run multiple times (uses UPSERT patterns where appropriate)

-- Use a PL/pgSQL block so we can upsert and reference values across statements
DO $$
DECLARE
  org_id UUID;
BEGIN
  -- Create or upsert the demo organization and capture the id
  INSERT INTO organizations (name, slug)
  VALUES ('Demo Organization', 'demo-organization')
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO org_id;

  -- Create or update the user profile for the existing auth user
  INSERT INTO users (id, organization_id, email, full_name, role)
  VALUES (
    '36dce9fe-ad1b-4eca-841e-5d959b1b5cf5'::uuid, -- replace if needed
    org_id,
    'test@test.com',
    'Test User',
    'owner'
  )
  ON CONFLICT (id) DO UPDATE SET organization_id = EXCLUDED.organization_id, email = EXCLUDED.email, full_name = EXCLUDED.full_name;

  -- Add a demo client if not exists
  IF NOT EXISTS (SELECT 1 FROM clients WHERE organization_id = org_id AND name = 'Demo Client') THEN
    INSERT INTO clients (organization_id, name, industry, description, voice_prompt, default_cta)
    VALUES (org_id, 'Demo Client', 'Home Services', 'Demo client for testing', 'Be friendly and helpful', 'Learn more');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- After running, refresh the app and verify Dashboard shows "Demo Client" under Active Clients and profile data appears.
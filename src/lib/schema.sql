-- Maximus Engagimus Database Schema
-- Complete PostgreSQL schema for Supabase

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLE 1: ORGANIZATIONS
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE 2: USERS
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE 3: CLIENTS
-- ============================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100) NOT NULL,
  description TEXT,
  voice_prompt TEXT NOT NULL,
  voice_prompt_with_cta TEXT,
  default_cta TEXT,
  target_audience TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_organization ON clients(organization_id);
CREATE INDEX idx_clients_active ON clients(organization_id, is_active);

-- ============================================
-- TABLE 4: CLIENT_PLATFORMS
-- ============================================
CREATE TABLE client_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL CHECK (platform IN (
    'instagram', 'facebook', 'linkedin', 'x', 'tiktok', 
    'reddit', 'forum', 'houzz', 'youtube', 'other'
  )),
  handle VARCHAR(255),
  profile_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_client_platforms_client ON client_platforms(client_id);

-- ============================================
-- TABLE 5: CLIENT_KEYWORDS
-- ============================================
CREATE TABLE client_keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  keyword VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_client_keywords_client ON client_keywords(client_id);
CREATE INDEX idx_client_keywords_keyword ON client_keywords(keyword);

-- ============================================
-- TABLE 6: CLIENT_SAMPLE_COMMENTS
-- ============================================
CREATE TABLE client_sample_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform VARCHAR(50),
  comment_text TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_client_sample_comments_client ON client_sample_comments(client_id);

-- ============================================
-- TABLE 7: CLIENT_INDUSTRY_SITES
-- ============================================
CREATE TABLE client_industry_sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  site_name VARCHAR(255) NOT NULL,
  site_url TEXT,
  site_type VARCHAR(50) CHECK (site_type IN (
    'forum', 'community', 'directory', 'review_site', 
    'social_platform', 'news_site', 'other'
  )),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_client_industry_sites_client ON client_industry_sites(client_id);

-- ============================================
-- TABLE 8: COMPETITORS
-- ============================================
CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  website TEXT,
  description TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_competitors_client ON competitors(client_id);

-- ============================================
-- TABLE 9: COMPETITOR_SIGHTINGS
-- ============================================
CREATE TABLE competitor_sightings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  location_type VARCHAR(50) NOT NULL CHECK (location_type IN (
    'facebook_group', 'linkedin_group', 'forum', 'subreddit',
    'discord', 'slack', 'youtube', 'podcast', 'blog', 
    'news_article', 'review_site', 'other'
  )),
  location_name VARCHAR(255) NOT NULL,
  location_url TEXT,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  notes TEXT,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_competitor_sightings_competitor ON competitor_sightings(competitor_id);
CREATE INDEX idx_competitor_sightings_priority ON competitor_sightings(priority);
CREATE INDEX idx_competitor_sightings_last_seen ON competitor_sightings(last_seen_at);

-- ============================================
-- TABLE 10: PREDEFINED_SIGHTING_NOTES
-- ============================================
CREATE TABLE predefined_sighting_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  note_text VARCHAR(255) NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_predefined_notes_org ON predefined_sighting_notes(organization_id);

-- ============================================
-- TABLE 11: AI_PROVIDERS
-- ============================================
CREATE TABLE ai_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider_name VARCHAR(100) NOT NULL,
  api_base_url TEXT NOT NULL,
  api_key_encrypted TEXT,
  model_name VARCHAR(100) NOT NULL,
  is_free BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  fallback_order INTEGER DEFAULT 999,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_providers_org ON ai_providers(organization_id);
CREATE INDEX idx_ai_providers_fallback ON ai_providers(organization_id, fallback_order);

-- ============================================
-- TABLE 12: AI_CHAT_LINKS
-- ============================================
CREATE TABLE ai_chat_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_chat_links_org ON ai_chat_links(organization_id);

-- ============================================
-- TABLE 13: PLATFORM_PROMPTS
-- ============================================
CREATE TABLE platform_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL CHECK (platform IN (
    'instagram', 'facebook', 'linkedin', 'x', 'tiktok', 
    'reddit', 'forum', 'houzz', 'youtube', 'other'
  )),
  style_prompt TEXT NOT NULL,
  max_length INTEGER,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, platform)
);

CREATE INDEX idx_platform_prompts_org ON platform_prompts(organization_id);

-- ============================================
-- TABLE 14: GENERATED_COMMENTS
-- ============================================
CREATE TABLE generated_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  platform VARCHAR(50) NOT NULL,
  source_content TEXT,
  source_url TEXT,
  existing_comments TEXT,
  poster_info TEXT,
  hashtags TEXT,
  include_cta BOOLEAN DEFAULT false,
  num_options INTEGER DEFAULT 3,
  generated_options JSONB NOT NULL,
  selected_option_index INTEGER,
  selected_option_style VARCHAR(50),
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  ai_provider_used VARCHAR(100),
  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_generated_comments_org ON generated_comments(organization_id);
CREATE INDEX idx_generated_comments_client ON generated_comments(client_id);
CREATE INDEX idx_generated_comments_user ON generated_comments(user_id);
CREATE INDEX idx_generated_comments_platform ON generated_comments(platform);
CREATE INDEX idx_generated_comments_created ON generated_comments(created_at);
CREATE INDEX idx_generated_comments_used ON generated_comments(is_used);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_sample_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_industry_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_sightings ENABLE ROW LEVEL SECURITY;
ALTER TABLE predefined_sighting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_comments ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Organizations: Open access for initial setup and management
CREATE POLICY "Anyone can view organizations"
  ON organizations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update organizations"
  ON organizations FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Users: Can see other users in same organization
CREATE POLICY "Users can view organization members"
  ON users FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());
CREATE POLICY "Users can view organization members"
  ON users FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Owners can manage organization members (promote/demote roles)
CREATE POLICY "Owners can manage members - update"
  ON users FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'owner')
  )
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND role IN ('owner', 'admin', 'member')
  );

CREATE POLICY "Owners can manage members - delete"
  ON users FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'owner')
  );
-- ============================================
-- Audit: Role change / membership logs
-- ============================================
CREATE TABLE role_change_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  actor_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('role_change', 'remove_member')),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_role_change_logs_org ON role_change_logs(organization_id);

ALTER TABLE role_change_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Orgs can insert role change logs"
  ON role_change_logs FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Orgs can view role change logs"
  ON role_change_logs FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Triggers to automatically log role changes and removals
CREATE OR REPLACE FUNCTION fn_log_user_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.role IS DISTINCT FROM NEW.role) THEN
    INSERT INTO role_change_logs (organization_id, user_id, actor_id, action, details)
    VALUES (NEW.organization_id, NEW.id, NULL, 'role_change', jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_user_role_change
  AFTER UPDATE OF role ON users
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE PROCEDURE fn_log_user_role_change();

CREATE OR REPLACE FUNCTION fn_log_user_removed()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO role_change_logs (organization_id, user_id, actor_id, action, details)
  VALUES (OLD.organization_id, OLD.id, NULL, 'remove_member', jsonb_build_object('email', OLD.email));
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_user_removed
  AFTER DELETE ON users
  FOR EACH ROW
  EXECUTE PROCEDURE fn_log_user_removed();
-- Clients: Organization-scoped access
CREATE POLICY "Users can view org clients"
  ON clients FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert org clients"
  ON clients FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update org clients"
  ON clients FOR UPDATE
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete org clients"
  ON clients FOR DELETE
  USING (organization_id = get_user_organization_id());

-- Client Platforms: Access through client
CREATE POLICY "Users can view client platforms"
  ON client_platforms FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE organization_id = get_user_organization_id()));

CREATE POLICY "Users can manage client platforms"
  ON client_platforms FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE organization_id = get_user_organization_id()));

-- Client Keywords: Access through client
CREATE POLICY "Users can view client keywords"
  ON client_keywords FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE organization_id = get_user_organization_id()));

CREATE POLICY "Users can manage client keywords"
  ON client_keywords FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE organization_id = get_user_organization_id()));

-- Client Sample Comments: Access through client
CREATE POLICY "Users can view client sample comments"
  ON client_sample_comments FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE organization_id = get_user_organization_id()));

CREATE POLICY "Users can manage client sample comments"
  ON client_sample_comments FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE organization_id = get_user_organization_id()));

-- Client Industry Sites: Access through client
CREATE POLICY "Users can view client industry sites"
  ON client_industry_sites FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE organization_id = get_user_organization_id()));

CREATE POLICY "Users can manage client industry sites"
  ON client_industry_sites FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE organization_id = get_user_organization_id()));

-- Competitors: Access through client
CREATE POLICY "Users can view competitors"
  ON competitors FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE organization_id = get_user_organization_id()));

CREATE POLICY "Users can manage competitors"
  ON competitors FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE organization_id = get_user_organization_id()));

-- Competitor Sightings: Access through competitor
CREATE POLICY "Users can view competitor sightings"
  ON competitor_sightings FOR SELECT
  USING (competitor_id IN (
    SELECT c.id FROM competitors c 
    JOIN clients cl ON c.client_id = cl.id 
    WHERE cl.organization_id = get_user_organization_id()
  ));

CREATE POLICY "Users can manage competitor sightings"
  ON competitor_sightings FOR ALL
  USING (competitor_id IN (
    SELECT c.id FROM competitors c 
    JOIN clients cl ON c.client_id = cl.id 
    WHERE cl.organization_id = get_user_organization_id()
  ));

-- Predefined Sighting Notes: Org-scoped + system notes
CREATE POLICY "Users can view sighting notes"
  ON predefined_sighting_notes FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system = true);

CREATE POLICY "Users can manage org sighting notes"
  ON predefined_sighting_notes FOR ALL
  USING (organization_id = get_user_organization_id() AND is_system = false);

-- AI Providers: Organization-scoped
CREATE POLICY "Users can view org AI providers"
  ON ai_providers FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage org AI providers"
  ON ai_providers FOR ALL
  USING (organization_id = get_user_organization_id());

-- AI Chat Links: Org-scoped + system links
CREATE POLICY "Users can view AI chat links"
  ON ai_chat_links FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system = true);

CREATE POLICY "Users can manage org AI chat links"
  ON ai_chat_links FOR ALL
  USING (organization_id = get_user_organization_id() AND is_system = false);

-- Platform Prompts: Org-scoped + system prompts
CREATE POLICY "Users can view platform prompts"
  ON platform_prompts FOR SELECT
  USING (organization_id = get_user_organization_id() OR is_system = true);

CREATE POLICY "Users can manage org platform prompts"
  ON platform_prompts FOR ALL
  USING (organization_id = get_user_organization_id() AND is_system = false);

-- Generated Comments: Organization-scoped
CREATE POLICY "Users can view org generated comments"
  ON generated_comments FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert org generated comments"
  ON generated_comments FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update org generated comments"
  ON generated_comments FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitors_updated_at
  BEFORE UPDATE ON competitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitor_sightings_updated_at
  BEFORE UPDATE ON competitor_sightings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_providers_updated_at
  BEFORE UPDATE ON ai_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_prompts_updated_at
  BEFORE UPDATE ON platform_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: SYSTEM DEFAULTS
-- ============================================

-- System predefined sighting notes
INSERT INTO predefined_sighting_notes (note_text, is_system) VALUES
  ('Posts here weekly', true),
  ('High engagement', true),
  ('Moderator in this group', true),
  ('Very active', true),
  ('Occasional poster', true),
  ('Responds to comments', true),
  ('Shares industry news', true),
  ('Promotes services frequently', true);

-- System AI chat links (for "No API" mode)
INSERT INTO ai_chat_links (name, url, icon, display_order, is_system) VALUES
  ('ChatGPT', 'https://chat.openai.com/', 'openai', 1, true),
  ('Claude', 'https://claude.ai/', 'anthropic', 2, true),
  ('Gemini', 'https://gemini.google.com/', 'google', 3, true),
  ('Perplexity', 'https://www.perplexity.ai/', 'search', 4, true),
  ('Poe', 'https://poe.com/', 'message-circle', 5, true),
  ('HuggingChat', 'https://huggingface.co/chat/', 'bot', 6, true);

-- System platform prompts
INSERT INTO platform_prompts (platform, style_prompt, max_length, is_system) VALUES
  ('instagram', 'Write in a warm, personable, and conversational tone. Use casual language that feels authentic. Keep it brief and engaging. Emojis are acceptable but use sparingly.', 150, true),
  ('facebook', 'Write in a friendly, approachable tone. Can be slightly longer than Instagram. Focus on building connection and encouraging discussion.', 200, true),
  ('linkedin', 'Write in a professional yet personable tone. Focus on adding value and demonstrating expertise. Avoid being too casual or using emojis.', 200, true),
  ('x', 'Write in a punchy, concise style. Be direct and impactful. Can be witty or thought-provoking. No hashtags unless specifically requested.', 100, true),
  ('tiktok', 'Write in a casual, fun, and energetic tone. Use language that resonates with younger audiences. Be authentic and relatable.', 100, true),
  ('reddit', 'Write in an authentic, community-focused tone. Be helpful and genuine. Avoid anything that sounds promotional or corporate. Match the subreddit culture.', 300, true),
  ('forum', 'Write in a helpful, informative tone. Focus on providing value and answering questions. Be respectful of the community and its norms.', 400, true),
  ('houzz', 'Write in a helpful, knowledgeable tone about home design and renovation. Focus on expertise and practical advice.', 300, true),
  ('youtube', 'Write engaging comments that add to the discussion. Reference specific parts of the video when relevant. Be authentic and conversational.', 200, true),
  ('other', 'Write in a professional yet approachable tone. Adapt to the context and platform norms. Focus on adding value to the conversation.', 250, true);

-- ============================================
-- USEFUL VIEWS
-- ============================================

-- View for client with keyword count
CREATE VIEW clients_with_stats AS
SELECT 
  c.*,
  (SELECT COUNT(*) FROM client_keywords ck WHERE ck.client_id = c.id) as keyword_count,
  (SELECT COUNT(*) FROM client_sample_comments csc WHERE csc.client_id = c.id) as sample_count,
  (SELECT COUNT(*) FROM competitors comp WHERE comp.client_id = c.id) as competitor_count,
  (SELECT COUNT(*) FROM generated_comments gc WHERE gc.client_id = c.id) as comment_count
FROM clients c;

-- View for competitor sighting insights
CREATE VIEW competitor_sighting_insights AS
SELECT 
  cs.location_type,
  cs.location_name,
  cs.location_url,
  COUNT(*) as sighting_count,
  COUNT(DISTINCT cs.competitor_id) as competitor_count,
  MAX(cs.last_seen_at) as most_recent_sighting,
  ARRAY_AGG(DISTINCT c.name) as competitor_names
FROM competitor_sightings cs
JOIN competitors c ON cs.competitor_id = c.id
GROUP BY cs.location_type, cs.location_name, cs.location_url;

-- ============================================
-- FUNCTIONS FOR API USAGE
-- ============================================

-- Function to get active AI provider with fallback
CREATE OR REPLACE FUNCTION get_next_ai_provider(org_id UUID, exclude_ids UUID[] DEFAULT '{}')
RETURNS TABLE (
  id UUID,
  provider_name VARCHAR,
  api_base_url TEXT,
  api_key_encrypted TEXT,
  model_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.id,
    ap.provider_name,
    ap.api_base_url,
    ap.api_key_encrypted,
    ap.model_name
  FROM ai_providers ap
  WHERE ap.organization_id = org_id
    AND ap.is_active = true
    AND ap.id != ALL(exclude_ids)
  ORDER BY ap.is_default DESC, ap.fallback_order ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark comment as used
CREATE OR REPLACE FUNCTION mark_comment_used(comment_id UUID, option_index INTEGER, option_style VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE generated_comments
  SET 
    selected_option_index = option_index,
    selected_option_style = option_style,
    is_used = true,
    used_at = NOW()
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get client match scores for content analysis
CREATE OR REPLACE FUNCTION analyze_content_for_clients(
  org_id UUID,
  content_text TEXT
)
RETURNS TABLE (
  client_id UUID,
  client_name VARCHAR,
  industry VARCHAR,
  relevance_score INTEGER,
  matched_keywords TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as client_id,
    c.name as client_name,
    c.industry,
    (
      -- Base score for active client
      CASE WHEN c.is_active THEN 10 ELSE 0 END +
      -- Keyword matches (10 points each)
      COALESCE((
        SELECT COUNT(*) * 10
        FROM client_keywords ck
        WHERE ck.client_id = c.id
          AND content_text ILIKE '%' || ck.keyword || '%'
      ), 0)
    )::INTEGER as relevance_score,
    COALESCE(
      ARRAY(
        SELECT ck.keyword
        FROM client_keywords ck
        WHERE ck.client_id = c.id
          AND content_text ILIKE '%' || ck.keyword || '%'
      )::text[],
      ARRAY[]::text[]
    ) as matched_keywords
  FROM clients c
  WHERE c.organization_id = org_id
    AND c.is_active = true
  ORDER BY relevance_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: AUTO-CREATE USER PROFILES
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

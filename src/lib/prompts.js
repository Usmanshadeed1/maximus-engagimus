/**
 * Prompt Templates
 * 
 * All prompt templates for comment generation, content analysis,
 * and industry site suggestions.
 */

/**
 * Build the system prompt for comment generation
 */
export function buildSystemPrompt(options) {
  const {
    client,
    platform,
    platformPrompt,
    includeCta = false,
  } = options;

  const voicePrompt = includeCta && client.voice_prompt_with_cta
    ? client.voice_prompt_with_cta
    : client.voice_prompt;

  const sampleComments = client.sample_comments
    ?.filter(s => !s.platform || s.platform === platform) // Filter by platform or include "any platform" samples
    ?.map((s, i) => `${i + 1}. "${s.comment_text}"`)
    .join('\n') || 'No samples provided.';

  const keywords = client.keywords?.map(k => k.keyword).join(', ') || 'None';

  return `You are a social media engagement specialist writing comments for ${client.name}.

## CLIENT PROFILE
- Industry: ${client.industry}
- Description: ${client.description || 'Not provided'}
- Target Audience: ${client.target_audience || 'General audience'}
- Keywords: ${keywords}

## VOICE & STYLE
${voicePrompt}

${includeCta && client.default_cta ? `## CALL TO ACTION (use subtly when appropriate)
${client.default_cta}` : ''}

## SAMPLE COMMENTS (match this style)
${sampleComments}

## PLATFORM-SPECIFIC GUIDELINES (${platform.toUpperCase()})
${platformPrompt?.style_prompt || 'Write in a professional yet approachable tone.'}
${platformPrompt?.max_length ? `Maximum length: ${platformPrompt.max_length} characters` : ''}

## RULES
1. Sound human and authentic - never robotic or generic
2. Match the platform's typical tone and length
3. Add value to the conversation
4. Avoid hashtags unless specifically requested
5. Never repeat phrases from existing comments
6. Each option should have a distinctly different approach
7. Keep comments concise and impactful`;
}

/**
 * Build the user prompt for comment generation
 */
export function buildUserPrompt(options) {
  const {
    content,
    existingComments,
    posterInfo,
    hashtags,
    numOptions = 3,
    includeCta = false,
  } = options;

  let prompt = `## CONTENT TO RESPOND TO
${content}`;

  if (posterInfo) {
    prompt += `\n\n## POSTER INFORMATION
${posterInfo}`;
  }

  if (hashtags) {
    prompt += `\n\n## HASHTAGS USED
${hashtags}`;
  }

  if (existingComments) {
    prompt += `\n\n## EXISTING COMMENTS (avoid similar phrasing)
${existingComments}`;
  }

  prompt += `\n\n## YOUR TASK
Generate exactly ${numOptions} unique comment options. Each should take a different approach:

1. **Conversational** - Friendly and casual, like chatting with a friend
2. **Professional** - Polished and knowledgeable, establishes expertise  
3. **Question-Based** - Asks an engaging question to spark discussion
4. **Value-Add** - Provides a helpful tip, insight, or resource
5. **Brief** - Short and punchy, gets straight to the point

${includeCta ? 'Include a subtle call-to-action where it feels natural (not forced).' : 'Do NOT include any promotional content or calls-to-action.'}

## RESPONSE FORMAT
Respond with a JSON array. Each object should have:
- "style": The approach name (conversational, professional, question, value-add, or brief)
- "text": The comment text

Example:
[
  {"style": "conversational", "text": "This is so relatable! I've been..."},
  {"style": "professional", "text": "Great insights on..."},
  {"style": "question", "text": "Have you considered..."}
]

Generate ${numOptions} options now:`;

  return prompt;
}

/**
 * Build messages array for AI completion
 */
export function buildCommentMessages(systemPrompt, userPrompt) {
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

/**
 * Build the prompt for content analysis (matching content to clients)
 */
export function buildContentAnalysisPrompt(content, clients) {
  const clientSummaries = clients.map(client => {
    const keywords = client.keywords?.map(k => k.keyword).join(', ') || 'None';
    return `
### ${client.name}
- Industry: ${client.industry}
- Keywords: ${keywords}
- Target Audience: ${client.target_audience || 'Not specified'}
- Description: ${client.description || 'Not provided'}`;
  }).join('\n');

  return `You are a content analyst helping match social media content to relevant client profiles.

## CONTENT TO ANALYZE
${content}

## AVAILABLE CLIENTS
${clientSummaries}

## YOUR TASK
Analyze the content and determine which clients it's relevant to.

For each relevant client, provide:
1. Relevance level: "high", "medium", or "low"
2. Why it's relevant (industry match, keyword match, audience fit)
3. A suggested engagement angle for that client

## RESPONSE FORMAT
Respond with a JSON array. Each object should have:
- "client_name": The client name
- "relevance": "high", "medium", or "low"
- "reasons": Array of strings explaining why it's relevant
- "angle": Suggested engagement angle

Only include clients with at least some relevance. Example:
[
  {
    "client_name": "ABC Company",
    "relevance": "high",
    "reasons": ["Industry match: both in construction", "Keyword match: renovation"],
    "angle": "Comment on shared challenges in the renovation space"
  }
]

Analyze now:`;
}

/**
 * Build the prompt for suggesting industry-specific sites
 */
export function buildIndustrySitePrompt(industry, existingSites = []) {
  const existingList = existingSites.length > 0
    ? `\nAlready tracking: ${existingSites.join(', ')}`
    : '';

  return `You are an expert in digital marketing and online communities.

## TASK
Suggest 5-10 online platforms, forums, and communities where ${industry} professionals and enthusiasts actively engage.
${existingList}

## REQUIREMENTS
- Focus on platforms with active discussions (not just company pages)
- Include a mix of: social platforms, forums, industry sites, Q&A sites, communities
- Prioritize platforms where commenting/engagement is common
- Don't suggest platforms already being tracked

## RESPONSE FORMAT
Respond with a JSON array. Each object should have:
- "name": Platform/site name
- "url": Full URL (if applicable)
- "type": One of: forum, community, directory, review_site, social_platform, news_site, other
- "description": Brief description of why it's good for engagement

Example:
[
  {
    "name": "r/construction",
    "url": "https://reddit.com/r/construction",
    "type": "community",
    "description": "Active subreddit with 500k+ members discussing construction projects"
  }
]

Suggest platforms for the ${industry} industry:`;
}

/**
 * Platform-specific prompt enhancements
 */
export const PLATFORM_PROMPTS = {
  instagram: {
    style_prompt: 'Write in a warm, personable, and conversational tone. Use casual language that feels authentic. Keep it brief and engaging. Emojis are acceptable but use sparingly (1-2 max).',
    max_length: 150,
  },
  facebook: {
    style_prompt: 'Write in a friendly, approachable tone. Can be slightly longer than Instagram. Focus on building connection and encouraging discussion.',
    max_length: 200,
  },
  linkedin: {
    style_prompt: 'Write in a professional yet personable tone. Focus on adding value and demonstrating expertise. Avoid being too casual or using emojis. Use industry-relevant language.',
    max_length: 200,
  },
  x: {
    style_prompt: 'Write in a punchy, concise style. Be direct and impactful. Can be witty or thought-provoking. No hashtags unless specifically requested.',
    max_length: 100,
  },
  tiktok: {
    style_prompt: 'Write in a casual, fun, and energetic tone. Use language that resonates with younger audiences. Be authentic and relatable. Can use trending phrases appropriately.',
    max_length: 100,
  },
  reddit: {
    style_prompt: 'Write in an authentic, community-focused tone. Be helpful and genuine. Avoid anything that sounds promotional or corporate. Match the subreddit culture. Add value to the discussion.',
    max_length: 300,
  },
  forum: {
    style_prompt: 'Write in a helpful, informative tone. Focus on providing value and answering questions. Be respectful of the community and its norms. Can be more detailed.',
    max_length: 400,
  },
  houzz: {
    style_prompt: 'Write in a helpful, knowledgeable tone about home design and renovation. Focus on expertise and practical advice. Be encouraging and supportive of homeowner projects.',
    max_length: 300,
  },
  youtube: {
    style_prompt: 'Write engaging comments that add to the discussion. Reference specific parts of the video when relevant. Be authentic and conversational. Add your own perspective.',
    max_length: 200,
  },
  other: {
    style_prompt: 'Write in a professional yet approachable tone. Adapt to the context and platform norms. Focus on adding value to the conversation.',
    max_length: 250,
  },
};

/**
 * Get platform prompt with fallback
 */
export function getPlatformPromptDefaults(platform) {
  return PLATFORM_PROMPTS[platform] || PLATFORM_PROMPTS.other;
}

/**
 * Comment style descriptions for UI display
 */
export const COMMENT_STYLE_INFO = {
  conversational: {
    name: 'Conversational',
    description: 'Friendly and casual, like chatting with a friend',
    icon: 'message-circle',
  },
  professional: {
    name: 'Professional',
    description: 'Polished and knowledgeable, establishes expertise',
    icon: 'briefcase',
  },
  question: {
    name: 'Question-Based',
    description: 'Asks an engaging question to spark discussion',
    icon: 'help-circle',
  },
  'value-add': {
    name: 'Value-Add',
    description: 'Provides a helpful tip, insight, or resource',
    icon: 'lightbulb',
  },
  brief: {
    name: 'Brief',
    description: 'Short and punchy, gets straight to the point',
    icon: 'zap',
  },
};

/**
 * Generate a "No API" prompt that can be copied to clipboard
 */
export function generateClipboardPrompt(options) {
  const {
    client,
    platform,
    platformPrompt,
    content,
    existingComments,
    posterInfo,
    hashtags,
    numOptions = 3,
    includeCta = false,
  } = options;

  // Use provided platformPrompt or fall back to defaults
  const effectivePlatformPrompt = platformPrompt || getPlatformPromptDefaults(platform);
  
  const systemPrompt = buildSystemPrompt({
    client,
    platform,
    platformPrompt: effectivePlatformPrompt,
    includeCta,
  });

  const userPrompt = buildUserPrompt({
    content,
    existingComments,
    posterInfo,
    hashtags,
    numOptions,
    includeCta,
  });

  return `${systemPrompt}

---

${userPrompt}`;
}

export default {
  buildSystemPrompt,
  buildUserPrompt,
  buildCommentMessages,
  buildContentAnalysisPrompt,
  buildIndustrySitePrompt,
  getPlatformPromptDefaults,
  generateClipboardPrompt,
  PLATFORM_PROMPTS,
  COMMENT_STYLE_INFO,
};

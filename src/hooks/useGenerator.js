/**
 * useGenerator Hook
 * 
 * Custom hook for generating comments with AI providers.
 */

import { useState, useCallback } from 'react';
import { generateCompletion, parseCommentOptions, AIError } from '../lib/ai';
import {
  buildSystemPrompt,
  buildUserPrompt,
  buildCommentMessages,
  generateClipboardPrompt,
  getPlatformPromptDefaults,
} from '../lib/prompts';
import { saveGeneratedComments, markCommentAsUsed, getPlatformPrompt } from '../lib/supabase';
import { copyToClipboard } from '../lib/utils';
import { toast } from '../components/ui/Toast';

/**
 * Main hook for comment generation
 */
export function useGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState([]);
  const [generationId, setGenerationId] = useState(null);
  const [generationMeta, setGenerationMeta] = useState(null);

  /**
   * Generate comments for given input
   */
  const generate = useCallback(async (input) => {
    const {
      client,
      platform,
      content,
      existingComments,
      posterInfo,
      hashtags,
      numOptions = 3,
      includeCta = false,
    } = input;

    if (!client) {
      toast.error('Please select a client');
      return { success: false };
    }

    if (!platform) {
      toast.error('Please select a platform');
      return { success: false };
    }

    if (!content?.trim()) {
      toast.error('Please enter content to respond to');
      return { success: false };
    }

    setLoading(true);
    setError(null);
    setOptions([]);
    setGenerationId(null);

    const startTime = Date.now();

    try {
      // Get platform-specific prompt (custom or default)
      let platformPrompt;
      try {
        platformPrompt = await getPlatformPrompt(platform);
      } catch {
        platformPrompt = getPlatformPromptDefaults(platform);
      }

      // Build prompts
      const systemPrompt = buildSystemPrompt({
        client,
        platform,
        platformPrompt,
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

      const messages = buildCommentMessages(systemPrompt, userPrompt);

      // Call AI provider
      const result = await generateCompletion(messages, {
        temperature: 0.8,
        maxTokens: 1500,
      });

      // Parse the response
      const parsedOptions = parseCommentOptions(result.content);

      if (parsedOptions.length === 0) {
        throw new Error('Failed to parse comment options from AI response');
      }

      // Save to database
      const generationTime = Date.now() - startTime;
      const savedGeneration = await saveGeneratedComments({
        client_id: client.id,
        platform,
        source_content: content,
        existing_comments: existingComments || null,
        poster_info: posterInfo || null,
        hashtags: hashtags || null,
        include_cta: includeCta,
        num_options: numOptions,
        generated_options: parsedOptions,
        ai_provider_used: result.provider,
        generation_time_ms: generationTime,
      });

      setOptions(parsedOptions);
      setGenerationId(savedGeneration.id);
      setGenerationMeta({
        provider: result.provider,
        model: result.model,
        generationTime,
      });

      toast.success(`Generated ${parsedOptions.length} comment options`);
      return { success: true, options: parsedOptions };

    } catch (err) {
      console.error('Generation error:', err);
      
      let errorMessage = 'Failed to generate comments';
      
      if (err instanceof AIError) {
        if (err.code === 'NO_PROVIDERS') {
          errorMessage = 'No AI providers configured. Please add one in Settings.';
        } else if (err.code === 'ALL_FAILED') {
          errorMessage = 'All AI providers failed. Please check your API keys.';
        } else {
          errorMessage = err.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };

    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Mark an option as used
   */
  const markAsUsed = useCallback(async (optionIndex, optionStyle) => {
    if (!generationId) return;

    try {
      await markCommentAsUsed(generationId, optionIndex, optionStyle);
      
      // Update local state
      setOptions(prev =>
        prev.map((opt, idx) =>
          idx === optionIndex ? { ...opt, isUsed: true } : opt
        )
      );

      toast.success('Comment marked as used');
    } catch (err) {
      console.error('Error marking as used:', err);
      toast.error('Failed to mark as used');
    }
  }, [generationId]);

  /**
   * Mark an option as saved (client sample comment)
   */
  const markOptionSaved = useCallback((optionIndex) => {
    setOptions(prev => prev.map((opt, idx) => idx === optionIndex ? { ...opt, isSaved: true } : opt));
  }, []);

  /**
   * Copy option text to clipboard
   */
  const copyOption = useCallback(async (optionText) => {
    const success = await copyToClipboard(optionText);
    if (success) {
      toast.success('Copied to clipboard');
    } else {
      toast.error('Failed to copy');
    }
    return success;
  }, []);

  /**
   * Generate prompt for "No API" mode (copy to clipboard)
   */
  const generatePromptForClipboard = useCallback(async (input) => {
    const {
      client,
      platform,
      content,
      existingComments,
      posterInfo,
      hashtags,
      numOptions = 3,
      includeCta = false,
    } = input;

    if (!client || !platform || !content?.trim()) {
      toast.error('Please fill in all required fields');
      return null;
    }

    const prompt = generateClipboardPrompt({
      client,
      platform,
      content,
      existingComments,
      posterInfo,
      hashtags,
      numOptions,
      includeCta,
    });

    const success = await copyToClipboard(prompt);
    if (success) {
      // Short instructional message including keyboard paste hints for Windows/Mac
      toast.success('Prompt copied — paste into chat (Ctrl/⌘+V)');
    } else {
      toast.error('Failed to copy prompt');
    }

    return prompt;
  }, []);

  /**
   * Clear current results
   */
  const clear = useCallback(() => {
    setOptions([]);
    setError(null);
    setGenerationId(null);
    setGenerationMeta(null);
  }, []);

  return {
    // State
    loading,
    error,
    options,
    generationId,
    generationMeta,
    
    // Actions
    generate,
    markAsUsed,
    copyOption,
    generatePromptForClipboard,
    clear,
    // Mutators
    markOptionSaved,
  };
}

export default useGenerator;

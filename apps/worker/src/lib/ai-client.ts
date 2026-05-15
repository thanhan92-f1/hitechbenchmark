/**
 * Unified AI client supporting multiple providers via Anthropic SDK and OpenAI-compatible API.
 *
 * Configuration via environment variables:
 *   AI_PROVIDER  — anthropic | openai | azure | groq | together | ollama | lmstudio | disabled
 *   AI_API_KEY   — API key (not required for ollama/lmstudio)
 *   AI_MODEL     — Model name (overrides provider default)
 *   AI_BASE_URL  — Custom base URL (overrides provider default)
 *   AI_MAX_TOKENS — Max tokens for completions (default: 1024)
 *
 * Azure-specific:
 *   AZURE_OPENAI_ENDPOINT    — e.g. https://my-resource.openai.azure.com
 *   AZURE_OPENAI_DEPLOYMENT  — Deployment name
 *   AZURE_OPENAI_API_VERSION — API version (default: 2024-10-21)
 */

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

export type AIProvider =
  | 'anthropic'
  | 'openai'
  | 'azure'
  | 'groq'
  | 'together'
  | 'ollama'
  | 'lmstudio'
  | 'disabled'

interface ProviderDefaults {
  model: string
  baseUrl?: string
}

const PROVIDER_DEFAULTS: Record<string, ProviderDefaults> = {
  anthropic: { model: 'claude-haiku-4-5-20251001' },
  openai:    { model: 'gpt-4o-mini' },
  azure:     { model: 'gpt-4o-mini' },
  groq:      { model: 'llama-3.1-8b-instant',                              baseUrl: 'https://api.groq.com/openai/v1' },
  together:  { model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',       baseUrl: 'https://api.together.xyz/v1' },
  ollama:    { model: 'llama3.2',                                           baseUrl: 'http://localhost:11434/v1' },
  lmstudio:  { model: 'local-model',                                        baseUrl: 'http://localhost:1234/v1' },
}

function resolveConfig() {
  const provider = (process.env.AI_PROVIDER || 'anthropic') as AIProvider
  const defaults = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.openai

  return {
    provider,
    apiKey: process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY || '',
    model: process.env.AI_MODEL || defaults.model,
    baseUrl: process.env.AI_BASE_URL || defaults.baseUrl,
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '1024', 10),
    azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
    azureDeployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini',
    azureApiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-10-21',
  }
}

/**
 * Send a prompt to the configured AI provider and return the text response.
 * Returns null if AI is disabled or API key is missing.
 * Throws on network/API errors.
 */
export async function aiComplete(systemPrompt: string, userContent: string): Promise<string | null> {
  const cfg = resolveConfig()

  if (cfg.provider === 'disabled') {
    console.log('[AI] Provider disabled — skipping')
    return null
  }

  const isLocal = cfg.provider === 'ollama' || cfg.provider === 'lmstudio'

  if (!cfg.apiKey && !isLocal) {
    console.warn(`[AI] No API key set for provider "${cfg.provider}" — skipping`)
    return null
  }

  console.log(`[AI] ${cfg.provider} / ${cfg.model}`)

  // ── Anthropic SDK ────────────────────────────────────────────────────────
  if (cfg.provider === 'anthropic') {
    const client = new Anthropic({ apiKey: cfg.apiKey })
    const res = await client.messages.create({
      model: cfg.model,
      max_tokens: cfg.maxTokens,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userContent }],
    })
    return res.content[0].type === 'text' ? res.content[0].text : null
  }

  // ── Azure OpenAI ─────────────────────────────────────────────────────────
  if (cfg.provider === 'azure') {
    if (!cfg.azureEndpoint) throw new Error('AZURE_OPENAI_ENDPOINT not set')
    const client = new OpenAI({
      apiKey: cfg.apiKey || 'azure',
      baseURL: `${cfg.azureEndpoint}/openai/deployments/${cfg.azureDeployment}`,
      defaultQuery: { 'api-version': cfg.azureApiVersion },
      defaultHeaders: { 'api-key': cfg.apiKey },
    })
    const res = await client.chat.completions.create({
      model: cfg.azureDeployment,
      max_tokens: cfg.maxTokens,
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    })
    return res.choices[0]?.message?.content ?? null
  }

  // ── OpenAI-compatible (openai, groq, together, ollama, lmstudio, custom) ─
  const client = new OpenAI({
    apiKey: isLocal ? 'local' : cfg.apiKey,
    baseURL: cfg.baseUrl,
  })

  const res = await client.chat.completions.create({
    model: cfg.model,
    max_tokens: cfg.maxTokens,
    temperature: 0.3,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
  })
  return res.choices[0]?.message?.content ?? null
}

/** Returns the active provider name for logging/UI. */
export function getActiveProvider(): AIProvider {
  return (process.env.AI_PROVIDER || 'anthropic') as AIProvider
}

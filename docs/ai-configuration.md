# AI Provider Configuration

HiTech Benchmark supports 8 AI providers for the AI performance analysis feature. Configure via environment variables in the worker service.

## Quick Start

Set two variables in `apps/worker/.env`:

```env
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-...
```

---

## Supported Providers

| Provider | `AI_PROVIDER` | Default Model | Notes |
|---|---|---|---|
| Anthropic Claude | `anthropic` | `claude-haiku-4-5-20251001` | Native SDK, prompt caching |
| OpenAI | `openai` | `gpt-4o-mini` | — |
| Azure OpenAI | `azure` | `gpt-4o-mini` | Requires extra vars |
| Groq | `groq` | `llama-3.1-8b-instant` | Very fast, free tier |
| Together AI | `together` | `meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo` | Affordable |
| Ollama | `ollama` | `llama3.2` | Local, no API key needed |
| LM Studio | `lmstudio` | `local-model` | Local, no API key needed |
| Disabled | `disabled` | — | Turns off AI analysis |

---

## Configuration Variables

```env
# Required
AI_PROVIDER=anthropic          # Provider name (see table above)
AI_API_KEY=<your-key>          # Not required for ollama/lmstudio

# Optional overrides
AI_MODEL=claude-haiku-4-5-20251001  # Override default model
AI_BASE_URL=https://...             # Override base URL
AI_MAX_TOKENS=1024                  # Max response tokens (default: 1024)

# Azure only
AZURE_OPENAI_ENDPOINT=https://my-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-10-21
```

---

## Provider Setup

### Anthropic (Recommended)

Fastest setup. Uses prompt caching for cost efficiency.

```env
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-api03-...
# Optional: use a more capable model
AI_MODEL=claude-sonnet-4-6
```

Get your API key at [console.anthropic.com](https://console.anthropic.com).

### OpenAI

```env
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini   # or gpt-4o for better quality
```

### Azure OpenAI

```env
AI_PROVIDER=azure
AI_API_KEY=<azure-key>
AZURE_OPENAI_ENDPOINT=https://my-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=my-gpt4o-deployment
AZURE_OPENAI_API_VERSION=2024-10-21
```

### Groq (Free Tier Available)

Fast inference with Llama models. Free tier is generous.

```env
AI_PROVIDER=groq
AI_API_KEY=gsk_...
AI_MODEL=llama-3.1-8b-instant  # or llama-3.1-70b-versatile
```

Get your API key at [console.groq.com](https://console.groq.com).

### Together AI

```env
AI_PROVIDER=together
AI_API_KEY=...
AI_MODEL=meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo
```

### Ollama (Local, Free)

No API key required. Run models locally.

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3.2

# Start server (default: http://localhost:11434)
ollama serve
```

```env
AI_PROVIDER=ollama
AI_MODEL=llama3.2
# AI_BASE_URL=http://localhost:11434/v1  # default, only set if different
```

### LM Studio (Local, Free)

Download [LM Studio](https://lmstudio.ai), load a GGUF model, and start the local server.

```env
AI_PROVIDER=lmstudio
# AI_BASE_URL=http://localhost:1234/v1  # default
AI_MODEL=local-model  # must match the loaded model name in LM Studio
```

### Custom OpenAI-Compatible Endpoint

Any provider with an OpenAI-compatible API:

```env
AI_PROVIDER=openai
AI_API_KEY=<key>
AI_BASE_URL=https://api.my-provider.com/v1
AI_MODEL=my-model-name
```

### Disable AI Analysis

```env
AI_PROVIDER=disabled
```

---

## Cost Estimates

Analysis runs once per benchmark. Typical usage:

| Provider | Model | ~Cost/analysis |
|---|---|---|
| Anthropic | claude-haiku-4-5-20251001 | ~$0.0001 |
| OpenAI | gpt-4o-mini | ~$0.0002 |
| Groq | llama-3.1-8b-instant | Free (rate limits) |
| Ollama/LM Studio | any | Free (local compute) |

---

## Troubleshooting

**AI analysis not appearing on benchmark pages**
- Check worker logs: `docker compose logs worker`
- Verify `AI_PROVIDER` and `AI_API_KEY` are set in worker env
- For Ollama/LM Studio: ensure the local server is running and accessible from the worker container (`AI_BASE_URL=http://host.docker.internal:11434/v1`)

**"No API key set — skipping"**
- The worker logs this at WARNING level when `AI_API_KEY` is empty for non-local providers
- Add the key to `apps/worker/.env` and restart the worker

**JSON parse error in worker logs**
- The model returned malformed JSON; try a different/larger model
- Increase `AI_MAX_TOKENS` if responses are being truncated

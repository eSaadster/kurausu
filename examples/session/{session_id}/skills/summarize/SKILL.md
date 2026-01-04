# Summarize Skill

Summarize any URL (websites, YouTube, podcasts, PDFs, etc.) using the summarize CLI.

## Quick Start

```bash
bash ~/klaus/whatsapp/skills/summarize/summarize.sh "<url>"
```

## Requirements

- **OPENROUTER_API_KEY**: Configured in wrapper script
- **OPENAI_BASE_URL**: Set to `https://openrouter.ai/api/v1` by wrapper
- **Node.js**: Required for npx

## Default Model

`openai/xiaomi/mimo-v2-flash:free` (free tier via OpenRouter)

## Usage

**Basic usage (uses default free model):**
```bash
bash ~/klaus/whatsapp/skills/summarize/summarize.sh "https://example.com/article"
```

**With custom model (use openai/ prefix for OpenRouter models):**
```bash
bash ~/klaus/whatsapp/skills/summarize/summarize.sh "https://example.com" --model openai/anthropic/claude-3-haiku
```

**Pass additional arguments:**
```bash
bash ~/klaus/whatsapp/skills/summarize/summarize.sh "https://youtube.com/watch?v=..." --lang de
```

## Supported Content Types

- Websites and articles
- YouTube videos (transcripts)
- Podcasts
- PDF documents
- Any URL with extractable content

## Examples

**User**: "Summarize this article: https://example.com/blog/post"
**Action**:
```bash
bash ~/klaus/whatsapp/skills/summarize/summarize.sh "https://example.com/blog/post"
```

**User**: "Give me a summary of this YouTube video"
**Action**:
```bash
bash ~/klaus/whatsapp/skills/summarize/summarize.sh "https://youtube.com/watch?v=abc123"
```

## Notes

- The wrapper script automatically uses the free model unless `--model` is specified
- All arguments after the URL are passed through to the summarize CLI
- Uses `npx -y @steipete/summarize` under the hood
- API key is configured in the wrapper script

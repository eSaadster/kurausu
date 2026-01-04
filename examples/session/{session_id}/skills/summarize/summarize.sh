#!/bin/bash
# Summarize skill wrapper for @steipete/summarize CLI
# Default model: xiaomi/mimo-v2-flash:free (via OpenRouter)

set -e

# Configure OpenRouter as backend
export OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-}"
export OPENAI_BASE_URL="https://openrouter.ai/api/v1"

# Check for URL argument
if [ -z "$1" ]; then
    echo "Usage: summarize.sh <url> [options]"
    echo "Example: summarize.sh 'https://example.com' --model openai/anthropic/claude-3-haiku"
    exit 1
fi

URL="$1"
shift

# Check if --model was provided in remaining arguments
if [[ "$*" != *"--model"* ]]; then
    # Use default free model (openai/ prefix for OpenRouter backend)
    npx -y @steipete/summarize "$URL" --model "openai/xiaomi/mimo-v2-flash:free" "$@"
else
    # User specified their own model
    npx -y @steipete/summarize "$URL" "$@"
fi

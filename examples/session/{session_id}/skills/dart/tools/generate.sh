#!/bin/bash

# Generate an image from a text prompt using Gemini API
# Usage: ./generate.sh "prompt" [output_filename.png]

set -e

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source .env - check multiple locations
for ENV_PATH in "$SCRIPT_DIR/.env" "$SCRIPT_DIR/../.env" "$SCRIPT_DIR/../../.env" "$SCRIPT_DIR/../../../.env"; do
  if [ -f "$ENV_PATH" ]; then
    source "$ENV_PATH"
    break
  fi
done

PROMPT="$1"
OUTPUT_FILENAME="$2"

if [ -z "$PROMPT" ]; then
  echo "Usage: ./generate.sh <prompt> [output_filename.png]"
  echo ""
  echo "Generate an image from a text description using Gemini."
  echo ""
  echo "Examples:"
  echo '  ./generate.sh "a cat wearing a tiny top hat"'
  echo '  ./generate.sh "sunset over mountains" sunset.png'
  exit 0
fi

if [ -z "$GEMINI_API_KEY" ]; then
  echo "Error: GEMINI_API_KEY not set. Add it to $SCRIPT_DIR/.env"
  exit 1
fi

OUTPUT_DIR="$HOME/klaus/scratchpad/generated-images"
mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +%s)
SAFE_PROMPT=$(echo "$PROMPT" | head -c 50 | tr -dc 'a-zA-Z0-9' | tr '[:upper:]' '[:lower:]')
if [ -z "$OUTPUT_FILENAME" ]; then
  OUTPUT_FILENAME="${SAFE_PROMPT}_${TIMESTAMP}.png"
fi
OUTPUT_PATH="$OUTPUT_DIR/$OUTPUT_FILENAME"

echo "Generating image for: \"${PROMPT:0:80}...\""
echo "This may take 15-30 seconds..."

# Build JSON request body - escape the prompt for JSON
ESCAPED_PROMPT=$(echo "$PROMPT" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read().strip()))')

REQUEST_BODY=$(cat <<EOF
{
  "contents": [{
    "parts": [{"text": $ESCAPED_PROMPT}]
  }],
  "generationConfig": {
    "responseModalities": ["TEXT", "IMAGE"]
  }
}
EOF
)

# Make API request
RESPONSE=$(curl -s --max-time 60 \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_BODY")

# Use Python to parse the response
RESULT=$(echo "$RESPONSE" | python3 -c '
import json
import sys
import base64

try:
    data = json.load(sys.stdin)
except json.JSONDecodeError as e:
    print(f"ERROR:JSON parse error: {e}", file=sys.stderr)
    sys.exit(1)

# Check for API error
if "error" in data:
    msg = data["error"].get("message", str(data["error"]))
    print(f"ERROR:API error: {msg}", file=sys.stderr)
    sys.exit(1)

# Extract image data
candidates = data.get("candidates", [])
if not candidates:
    print("ERROR:No candidates in response", file=sys.stderr)
    sys.exit(1)

parts = candidates[0].get("content", {}).get("parts", [])
if not parts:
    print("ERROR:No parts in response", file=sys.stderr)
    sys.exit(1)

# Find image data
for part in parts:
    if "inlineData" in part:
        image_data = part["inlineData"].get("data", "")
        if image_data:
            print(image_data)
            sys.exit(0)

# No image, check for text response
for part in parts:
    if "text" in part:
        print(f"ERROR:No image generated. Response: {part['text']}", file=sys.stderr)
        sys.exit(1)

print("ERROR:No image data in response", file=sys.stderr)
sys.exit(1)
')

if [ $? -ne 0 ]; then
  echo "$RESULT"
  exit 1
fi

# Decode and save image
echo "$RESULT" | base64 -d > "$OUTPUT_PATH"

SIZE=$(stat -c%s "$OUTPUT_PATH" 2>/dev/null || stat -f%z "$OUTPUT_PATH" 2>/dev/null)

echo "Image generated successfully!"
echo "Path: $OUTPUT_PATH"
echo "Size: $SIZE bytes"

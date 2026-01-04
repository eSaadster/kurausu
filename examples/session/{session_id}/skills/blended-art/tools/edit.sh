#!/bin/bash

# Edit an image using a text prompt via Gemini API
# Usage: ./edit.sh <image_path> "prompt" [output_filename.png]

set -e

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source .env from skill folder if it exists
if [ -f "$SCRIPT_DIR/.env" ]; then
  source "$SCRIPT_DIR/.env"
fi

IMAGE_PATH="$1"
PROMPT="$2"
OUTPUT_FILENAME="$3"

if [ -z "$IMAGE_PATH" ] || [ -z "$PROMPT" ]; then
  echo "Usage: ./edit.sh <image_path> <prompt> [output_filename.png]"
  echo ""
  echo "Edit an existing image based on a text prompt using Gemini."
  echo ""
  echo "Examples:"
  echo '  ./edit.sh photo.jpg "make the sky purple"'
  echo '  ./edit.sh input.png "remove the background" cutout.png'
  exit 0
fi

if [ -z "$GEMINI_API_KEY" ]; then
  echo "Error: GEMINI_API_KEY not set. Add it to $SCRIPT_DIR/.env"
  exit 1
fi

if [ ! -f "$IMAGE_PATH" ]; then
  echo "Error: Image file not found: $IMAGE_PATH"
  exit 1
fi

OUTPUT_DIR="../../scratchpad/generated-images"
mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +%s)
SAFE_PROMPT=$(echo "$PROMPT" | head -c 30 | tr -dc 'a-zA-Z0-9' | tr '[:upper:]' '[:lower:]')
if [ -z "$OUTPUT_FILENAME" ]; then
  OUTPUT_FILENAME="edited_${SAFE_PROMPT}_${TIMESTAMP}.png"
fi
OUTPUT_PATH="$OUTPUT_DIR/$OUTPUT_FILENAME"

# Detect mime type from extension
EXT="${IMAGE_PATH##*.}"
EXT_LOWER=$(echo "$EXT" | tr '[:upper:]' '[:lower:]')
case "$EXT_LOWER" in
  png) MIME_TYPE="image/png" ;;
  webp) MIME_TYPE="image/webp" ;;
  gif) MIME_TYPE="image/gif" ;;
  *) MIME_TYPE="image/jpeg" ;;
esac

# Encode image to base64
BASE64_IMAGE=$(base64 -w 0 "$IMAGE_PATH" 2>/dev/null || base64 "$IMAGE_PATH" | tr -d '\n')

echo "Editing image: $IMAGE_PATH"
echo "Prompt: \"${PROMPT:0:80}...\""
echo "This may take 15-30 seconds..."

# Build JSON request body with image - escape the prompt for JSON
ESCAPED_PROMPT=$(echo "$PROMPT" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read().strip()))')

# Write request body to temp file to avoid "argument list too long" errors with large images
TEMP_REQUEST=$(mktemp)
trap "rm -f '$TEMP_REQUEST'" EXIT

cat > "$TEMP_REQUEST" <<EOF
{
  "contents": [{
    "parts": [
      {"text": $ESCAPED_PROMPT},
      {
        "inlineData": {
          "mimeType": "$MIME_TYPE",
          "data": "$BASE64_IMAGE"
        }
      }
    ]
  }],
  "generationConfig": {
    "responseModalities": ["TEXT", "IMAGE"]
  }
}
EOF

# Make API request using file for request body
RESPONSE=$(curl -s --max-time 60 \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "@$TEMP_REQUEST")

# Use Python to parse the response
RESULT=$(echo "$RESPONSE" | python3 -c '
import json
import sys

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

echo "Image edited successfully!"
echo "Path: $OUTPUT_PATH"
echo "Size: $SIZE bytes"

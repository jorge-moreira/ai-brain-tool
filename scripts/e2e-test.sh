#!/bin/bash
set -e

echo "Setting up temporary brain for e2e test..."
TEMP=$(mktemp -d)
trap "rm -rf $TEMP" EXIT

# Clone current state to temp dir
cp -r . "$TEMP/repo"
cd "$TEMP/repo"

# Install dependencies
bun install

# Create a test brain
BRAIN_PATH="$TEMP/test-brain"
mkdir -p "$BRAIN_PATH/raw/notes"
echo "# Test Note" > "$BRAIN_PATH/raw/notes/test.md"

# Run setup non-interactively by creating config manually
mkdir -p ~/.ai-brain-tool
echo '{"brains":{"test":"'"$BRAIN_PATH"'"}}' > ~/.ai-brain-tool/config.json
echo '{"gitSync":false,"extras":[],"obsidianDir":null}' > "$BRAIN_PATH/.brain-config.json"

# Create venv and install graphify
cd "$BRAIN_PATH"
python3 -m venv .venv
.venv/bin/pip install -q "graphifyy[mcp]==$(grep graphifyy requirements.txt | cut -d'=' -f3)"

# Run update command
cd "$TEMP/repo"
node bin/ai-brain.js update test

# Verify graph.json was produced
if [ -f "$BRAIN_PATH/graphify-out/graph.json" ]; then
  echo "E2E PASSED: graph.json created successfully"
  exit 0
else
  echo "E2E FAILED: graph.json not found"
  exit 1
fi

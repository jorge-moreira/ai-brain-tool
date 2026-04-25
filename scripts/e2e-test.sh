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

# Capture graphify version before changing directories
GRAPHIFY_VERSION=$(grep graphifyy requirements.txt | cut -d'=' -f3)

# Find Python 3.10+ (try python3.13, python3.12, python3.11, python3.10, then python3)
PYTHON_CMD=""
for py in python3.13 python3.12 python3.11 python3.10 python3; do
  if command -v $py &> /dev/null; then
    version=$($py --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
    major=$(echo $version | cut -d'.' -f1)
    minor=$(echo $version | cut -d'.' -f2)
    if [ "$major" -gt 3 ] || ([ "$major" -eq 3 ] && [ "$minor" -ge 10 ]); then
      PYTHON_CMD=$py
      break
    fi
  fi
done

if [ -z "$PYTHON_CMD" ]; then
  echo "ERROR: Python 3.10+ not found"
  exit 1
fi

echo "Using Python: $PYTHON_CMD ($($PYTHON_CMD --version))"

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
$PYTHON_CMD -m venv .venv
.venv/bin/pip install --upgrade pip -q
.venv/bin/pip install -q "graphifyy[mcp]==${GRAPHIFY_VERSION}" --index-url https://pypi.org/simple

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

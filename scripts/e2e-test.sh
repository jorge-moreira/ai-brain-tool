#!/bin/bash
set -e

echo "=== E2E Test: ai-brain setup and update ==="
TEMP=$(mktemp -d)
trap "rm -rf $TEMP" EXIT

BRAIN_PATH="$TEMP/brain"

echo "Step 1: Installing tool dependencies..."
cd "$GITHUB_WORKSPACE"
bun install

echo "Step 2: Creating brain with ai-brain setup..."
# Run setup with simulated input
# The setup wizard will:
# - Create brain folder structure
# - Detect Python (available on Ubuntu runner)
# - Create venv and install graphify

# Create brain directory first, then cd into it for "current" location option
mkdir -p "$BRAIN_PATH"
cd "$BRAIN_PATH"
node "$GITHUB_WORKSPACE/bin/ai-brain.js" setup <<EOF
test
current
local
n


n
EOF

echo "Step 3: Adding test content..."
mkdir -p "$BRAIN_PATH/raw/notes"
cat > "$BRAIN_PATH/raw/notes/test.md" << 'NOTE'
# Test Note

This is a test note for E2E validation.

## Concepts
- Testing
- Automation
- CI/CD
NOTE

echo "Step 4: Running ai-brain update..."
cd "$GITHUB_WORKSPACE"
node bin/ai-brain.js update test

echo "Step 5: Verifying results..."
if [ -f "$BRAIN_PATH/graphify-out/graph.json" ]; then
  NODE_COUNT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$BRAIN_PATH/graphify-out/graph.json')).nodes?.length || 0)")
  EDGE_COUNT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$BRAIN_PATH/graphify-out/graph.json')).edges?.length || 0)")
  
  if [ "$NODE_COUNT" -gt 0 ]; then
    echo "✅ E2E PASSED: graph.json created with $NODE_COUNT nodes, $EDGE_COUNT edges"
    exit 0
  else
    echo "⚠️  E2E WARNING: graph.json exists but has no nodes"
    exit 1
  fi
else
  echo "❌ E2E FAILED: graph.json not found"
  echo ""
  echo "Debug info:"
  echo "- Brain path: $BRAIN_PATH"
  echo "- Venv exists: $([ -f "$BRAIN_PATH/.venv/bin/python3" ] && echo 'yes' || echo 'no')"
  echo "- Brain folder contents:"
  ls -la "$BRAIN_PATH/" 2>&1 || true
  exit 1
fi

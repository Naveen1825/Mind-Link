#!/bin/bash

# Quick Test Script for Mind-Link Extension
# This script performs basic checks to verify the API updates

echo "🧪 Mind-Link API Update Quick Test"
echo "=================================="
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
  echo "⚠️  This script is designed for macOS. Adjust commands for other OS."
  echo ""
fi

# Test 1: Check if all required files exist
echo "📁 Test 1: Checking files..."
FILES=(
  "content/api.js"
  "background.js"
  "content/api-bridge.js"
  "check-api-availability.js"
  "manifest.json"
)

all_files_exist=true
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file exists"
  else
    echo "  ❌ $file missing"
    all_files_exist=false
  fi
done

echo ""

# Test 2: Check for old API patterns (should NOT be found)
echo "🔍 Test 2: Checking for old API patterns..."

old_patterns_found=false

# Check for old 'systemPrompt' (should be replaced with initialPrompts)
if grep -r "systemPrompt:" content/api.js background.js 2>/dev/null | grep -v "//"; then
  echo "  ⚠️  Found 'systemPrompt:' in files (should use initialPrompts)"
  old_patterns_found=true
fi

# Check for old 'tl;dr' (should be 'tldr')
if grep -r "type:.*['\"]tl;dr['\"]" content/ background.js check-api-availability.js 2>/dev/null; then
  echo "  ⚠️  Found 'tl;dr' (should be 'tldr')"
  old_patterns_found=true
fi

# Check for old 'self.ai' namespace (should be direct API access)
if grep -r "self\.ai\." background.js 2>/dev/null | grep -v "//"; then
  echo "  ⚠️  Found 'self.ai.' namespace (should use direct API access)"
  old_patterns_found=true
fi

if [ "$old_patterns_found" = false ]; then
  echo "  ✅ No old API patterns found"
fi

echo ""

# Test 3: Check for new API patterns (should be found)
echo "✨ Test 3: Checking for new API patterns..."

new_patterns_found=0

# Check for initialPrompts
if grep -q "initialPrompts" content/api.js && grep -q "initialPrompts" background.js; then
  echo "  ✅ Found 'initialPrompts' in api.js and background.js"
  ((new_patterns_found++))
else
  echo "  ❌ Missing 'initialPrompts' pattern"
fi

# Check for 'tldr' (without semicolon)
if grep -q "type:.*['\"]tldr['\"]" content/api.js background.js content/api-bridge.js check-api-availability.js 2>/dev/null; then
  echo "  ✅ Found 'tldr' type in files"
  ((new_patterns_found++))
else
  echo "  ❌ Missing 'tldr' type"
fi

# Check for direct LanguageModel access
if grep -q "typeof LanguageModel" background.js; then
  echo "  ✅ Found direct LanguageModel access in background.js"
  ((new_patterns_found++))
else
  echo "  ❌ Missing direct LanguageModel access"
fi

echo ""

# Test 4: Check manifest.json syntax
echo "🔧 Test 4: Checking manifest.json..."
if command -v python3 &> /dev/null; then
  if python3 -c "import json; json.load(open('manifest.json'))" 2>/dev/null; then
    echo "  ✅ manifest.json is valid JSON"
  else
    echo "  ❌ manifest.json has syntax errors"
  fi
else
  echo "  ⚠️  Python3 not found, skipping JSON validation"
fi

echo ""

# Summary
echo "=================================="
echo "📊 Test Summary"
echo "=================================="

if [ "$all_files_exist" = true ] && [ "$old_patterns_found" = false ] && [ "$new_patterns_found" -eq 3 ]; then
  echo "✅ All checks passed!"
  echo ""
  echo "Next steps:"
  echo "1. Load extension in Chrome: chrome://extensions/"
  echo "2. Open test page: file://$(pwd)/test-updated-apis.html"
  echo "3. Check service worker console for errors"
  echo "4. Run automated tests in the test page"
else
  echo "⚠️  Some checks failed. Review the output above."
  echo ""
  echo "Common fixes:"
  echo "- Ensure all file changes from API_UPDATE_CHECKLIST.md are applied"
  echo "- Reload the extension in Chrome"
  echo "- Clear browser cache"
fi

echo ""
echo "📚 Full testing guide: TESTING_GUIDE.md"
echo "🧪 Interactive test page: test-updated-apis.html"

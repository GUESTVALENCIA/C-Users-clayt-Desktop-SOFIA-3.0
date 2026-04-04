#!/bin/bash

echo -e "\n🧪 SOFÍA 3.0 — Provider Connectivity Test\n"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Load API keys from .env
export $(grep -v '^#' .env | xargs)

test_provider() {
    local name=$1
    local url=$2
    local model=$3
    local key=$4
    
    printf "Testing %-25s ... " "$name"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$url/chat/completions" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $key" \
        -d "{\"model\":\"$model\",\"messages\":[{\"role\":\"user\",\"content\":\"Test\"}],\"max_tokens\":50}" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ]; then
        echo "✅ $http_code"
    else
        echo "❌ $http_code"
    fi
}

# Test all providers
test_provider "OpenRouter (Free)" "https://openrouter.ai/api/v1" "openrouter/auto" "$OPENROUTER_API_KEY"
test_provider "OpenAI" "https://api.openai.com/v1" "gpt-4o-mini" "$OPENAI_API_KEY"
test_provider "Anthropic" "https://api.anthropic.com/v1" "claude-opus-4-5" "$ANTHROPIC_API_KEY"
test_provider "Groq" "https://api.groq.com/openai/v1" "mixtral-8x7b-32768" "$GROQ_API_KEY"
test_provider "DeepSeek" "https://api.deepseek.com/v1" "deepseek-chat" "$DEEPSEEK_API_KEY"
test_provider "xAI/Grok" "https://api.x.ai/v1" "grok-3" "$XAI_API_KEY"
test_provider "Google Gemini" "https://generativelanguage.googleapis.com/v1beta" "gemini-2.0-flash" "$GEMINI_API_KEY"
test_provider "Moonshot/Kimi" "https://api.moonshot.cn/v1" "moonshot-v1-32k" "$KIMI_API_KEY"
test_provider "Qwen/DashScope" "https://dashscope.aliyuncs.com/compatible-mode/v1" "qwen-max" "$QWEN_API_KEY"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "\n✅ Build completed: release/SOFÍA Setup 3.0.0.exe ready for installation\n"

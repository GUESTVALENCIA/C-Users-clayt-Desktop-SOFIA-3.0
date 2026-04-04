// ══════════════════════════════════════════════════════════════════════
//  SOFÍA 3.0 — Catálogo de Modelos G4F Ilimitados
//  ~250 modelos curados, todos via G4F localhost:8080/v1
//  Fecha: 2026-04-01
// ══════════════════════════════════════════════════════════════════════

export type G4FModelCategory =
  | 'text'
  | 'thinking'
  | 'research'
  | 'code'
  | 'vision'
  | 'audio'
  | 'image'
  | 'video'
  | 'search'

export interface G4FModel {
  id: string
  name: string
  category: G4FModelCategory
  subcategory?: string
  contextLength: number
  supportsTools: boolean
  supportsVision: boolean
  uncensored?: boolean
  realProvider?: string
  isFree: true
}

// ── Backward-compat interfaces (usados por RouterMetrics, chat-runtime, etc.) ──

export interface ModelInfo {
  id: string
  name: string
  displayName?: string
  contextLength: number
  supportsTools: boolean
  supportsVision: boolean
  inputPricePerM?: number
  outputPricePerM?: number
  tierTag?: 'auto' | 'paid' | 'tier' | 'account' | 'deepseek'
  isFree?: boolean
  authMode?: 'oauth' | 'api-key' | 'none'
  oauthProvider?: string
  providerKey?: string
  stability?: 'stable' | 'experimental'
  selectionKind?: 'api-route' | 'account' | 'fallback' | 'native'
  routeProvider?: string
  routeModel?: string
  preferredDirectProvider?: 'direct-openai' | 'direct-anthropic' | 'openrouter' | 'deepseek'
  preferredDirectModel?: string
  fallbackChain?: Array<{ provider: string; model: string; label: string }>
  uncensored?: boolean
  category?: G4FModelCategory
  subcategory?: string
}

export interface ProviderInfo {
  id: string
  name: string
  models: ModelInfo[]
  secretKey: string
}

export interface G4FProviderInfo {
  id: string
  name: string
  models: ModelInfo[]
}

// ══════════════════════════════════════════════════════════════════════
//  CATÁLOGO COMPLETO — 250 modelos G4F ilimitados
// ══════════════════════════════════════════════════════════════════════

// ── TEXTO FLAGSHIP (30) ──────────────────────────────────────────────

const TEXT_MODELS: G4FModel[] = [
  { id: 'gpt-4o', name: 'GPT-4o', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gpt-5.2-pro', name: 'GPT-5.2 Pro', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gpt-oss-120b', name: 'GPT OSS 120B', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, realProvider: 'Groq', isFree: true },
  { id: 'o1-pro', name: 'o1 Pro', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'o3-pro', name: 'o3 Pro', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'o3', name: 'o3', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'o1', name: 'o1', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'claude-opus-4.5', name: 'Claude Opus 4.5', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'claude-opus-4.1', name: 'Claude Opus 4.1', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'deepseek-v3.2-exp', name: 'DeepSeek V3.2 Exp \u2605 SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'deepseek-v3.2-speciale', name: 'DeepSeek V3.2 Speciale \u2605 SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'deepseek-v3-0324-turbo', name: 'DeepSeek V3 0324 Turbo', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B', category: 'text', contextLength: 64000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-prover-v2-671b', name: 'DeepSeek Prover V2 671B', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-r1t2-chimera', name: 'DeepSeek R1T2 Chimera', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-max', name: 'Qwen 3 Max', category: 'text', contextLength: 262144, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'qwen-3-235b-a22b-2507', name: 'Qwen 3 235B A22B', category: 'text', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', category: 'text', contextLength: 1000000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gemini-3-pro', name: 'Gemini 3 Pro', category: 'text', contextLength: 1000000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gemini-3-flash-search', name: 'Gemini 3 Flash Search', category: 'text', contextLength: 1000000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash', category: 'text', contextLength: 1000000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'llama-3.3-70b-turbo', name: 'Llama 3.3 70B Turbo', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'grok-4-fast', name: 'Grok 4 Fast \u2605 SIN CENSURA', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'glm-4.7', name: 'GLM 4.7', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'minimax-m2.7-highspeed', name: 'MiniMax M2.7 Highspeed', category: 'text', contextLength: 204800, supportsTools: true, supportsVision: false, realProvider: 'DeepInfra', isFree: true },
  { id: 'kimi-dev-72b', name: 'Kimi Dev 72B', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'moonshotai/Kimi-K2-Instruct', name: 'Kimi K2 Instruct', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'kimi-k2-0905', name: 'Kimi K2 0905', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
]

// ── THINKING/REASONING (46) ──────────────────────────────────────────

const THINKING_MODELS: G4FModel[] = [
  { id: 'claude-3-7-sonnet-20250219-thinking-32k', name: 'Claude 3.7 Sonnet Thinking 32K', category: 'thinking', contextLength: 200000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'claude-3.7-sonnet-thinking', name: 'Claude 3.7 Sonnet Thinking', category: 'thinking', contextLength: 200000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'claude-opus-4-1-20250805-thinking-16k', name: 'Claude Opus 4.1 Thinking 16K', category: 'thinking', contextLength: 200000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'claude-opus-4-20250514-thinking-16k', name: 'Claude Opus 4 Thinking 16K', category: 'thinking', contextLength: 200000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'claude-opus-4-5-20251101-thinking-32k', name: 'Claude Opus 4.5 Thinking 32K', category: 'thinking', contextLength: 200000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'claude-sonnet-4-20250514-thinking-32k', name: 'Claude Sonnet 4 Thinking 32K', category: 'thinking', contextLength: 200000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'claude-sonnet-4-5-20250929-thinking-32k', name: 'Claude Sonnet 4.5 Thinking 32K', category: 'thinking', contextLength: 200000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'deepseek-v3.2-thinking', name: 'DeepSeek V3.2 Thinking \u2605 SIN CENSURA', category: 'thinking', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'ernie-4.5-21b-a3b-thinking', name: 'Ernie 4.5 Thinking', category: 'thinking', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gemini-2.0-flash-thinking', name: 'Gemini 2.0 Flash Thinking', category: 'thinking', contextLength: 1000000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gemini-2.0-flash-thinking-with-apps', name: 'Gemini 2.0 Flash Thinking + Apps', category: 'thinking', contextLength: 1000000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gemini-2.5-flash-lite-preview-thinking', name: 'Gemini 2.5 Flash Lite Thinking', category: 'thinking', contextLength: 1000000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gemini-2.5-flash-lite-preview25-no-thinking', name: 'Gemini 2.5 Flash Lite No-Thinking', category: 'thinking', contextLength: 1000000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gemini-2.5-flash-thinking', name: 'Gemini 2.5 Flash Thinking', category: 'thinking', contextLength: 1000000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gemini-3-flash (thinking-minimal)', name: 'Gemini 3 Flash Thinking Minimal', category: 'thinking', contextLength: 1000000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'glm-4.1v-9b-thinking', name: 'GLM 4.1V 9B Thinking', category: 'thinking', contextLength: 131072, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gpt-5-thinking', name: 'GPT-5 Thinking', category: 'thinking', contextLength: 200000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gpt-5.1-thinking', name: 'GPT-5.1 Thinking', category: 'thinking', contextLength: 200000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gpt-5.2-thinking', name: 'GPT-5.2 Thinking', category: 'thinking', contextLength: 200000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'grok-3-mini-reasoning', name: 'Grok 3 Mini Reasoning \u2605 SIN CENSURA', category: 'thinking', contextLength: 131072, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'grok-3-reasoning', name: 'Grok 3 Reasoning \u2605 SIN CENSURA', category: 'thinking', contextLength: 131072, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'grok-4-1-fast-non-reasoning', name: 'Grok 4.1 Fast Non-Reasoning \u2605 SIN CENSURA', category: 'thinking', contextLength: 131072, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'grok-4-1-fast-reasoning', name: 'Grok 4.1 Fast Reasoning \u2605 SIN CENSURA', category: 'thinking', contextLength: 131072, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'grok-4-fast-reasoning', name: 'Grok 4 Fast Reasoning \u2605 SIN CENSURA', category: 'thinking', contextLength: 131072, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'grok-4-reasoning', name: 'Grok 4 Reasoning \u2605 SIN CENSURA', category: 'thinking', contextLength: 131072, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'grok-4.1-thinking', name: 'Grok 4.1 Thinking \u2605 SIN CENSURA', category: 'thinking', contextLength: 131072, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'hunyuan-vision-1.5-thinking', name: 'Hunyuan Vision 1.5 Thinking', category: 'thinking', contextLength: 128000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'kimi-k2-thinking', name: 'Kimi K2 Thinking', category: 'thinking', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'kimi-k2-thinking-turbo', name: 'Kimi K2 Thinking Turbo', category: 'thinking', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'kimi-vl-thinking', name: 'Kimi VL Thinking', category: 'thinking', contextLength: 131072, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'maestro-reasoning', name: 'Maestro Reasoning', category: 'thinking', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mimo-v2-flash (thinking)', name: 'MiMo V2 Flash Thinking', category: 'thinking', contextLength: 262144, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'phi-4-reasoning', name: 'Phi-4 Reasoning', category: 'thinking', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'phi-4-reasoning-plus', name: 'Phi-4 Reasoning Plus', category: 'thinking', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qvq-72b', name: 'QVQ 72B', category: 'thinking', contextLength: 131072, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'qvq-72b-preview-0310', name: 'QVQ 72B Preview', category: 'thinking', contextLength: 131072, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'qwen-3-235b-a22b-no-thinking', name: 'Qwen 3 235B No-Thinking', category: 'thinking', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-235b-a22b-thinking-2507', name: 'Qwen 3 235B Thinking', category: 'thinking', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-30b-a3b-thinking-2507', name: 'Qwen 3 30B Thinking', category: 'thinking', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-4b-thinking-2507', name: 'Qwen 3 4B Thinking', category: 'thinking', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-max-thinking', name: 'Qwen 3 Max Thinking', category: 'thinking', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-next-80b-a3b-thinking', name: 'Qwen 3 Next 80B Thinking', category: 'thinking', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-vl-235b-a22b-thinking', name: 'Qwen 3 VL 235B Thinking', category: 'thinking', contextLength: 262144, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'qwen-3-vl-30b-a3b-thinking', name: 'Qwen 3 VL 30B Thinking', category: 'thinking', contextLength: 262144, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'qwen-3-vl-8b-thinking', name: 'Qwen 3 VL 8B Thinking', category: 'thinking', contextLength: 131072, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'qwq-32b', name: 'QwQ 32B', category: 'thinking', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
]

// ── DEEP RESEARCH (3) ────────────────────────────────────────────────

const RESEARCH_MODELS: G4FModel[] = [
  { id: 'o3-deep-research', name: 'o3 Deep Research', category: 'research', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'o4-mini-deep-research', name: 'o4 Mini Deep Research', category: 'research', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'tongyi-deepresearch-30b-a3b', name: 'Tongyi Deep Research 30B', category: 'research', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
]

// ── CÓDIGO (6) ───────────────────────────────────────────────────────

const CODE_MODELS: G4FModel[] = [
  { id: 'gpt-5.1-codex-max', name: 'GPT-5.1 Codex Max', category: 'code', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'grok-code-fast-1', name: 'Grok Code Fast 1 \u2605 SIN CENSURA', category: 'code', contextLength: 256000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'qwen-3-coder-480b-a35b-turbo', name: 'Qwen 3 Coder 480B Turbo', category: 'code', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-coder-480b-a35b', name: 'Qwen 3 Coder 480B', category: 'code', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-coder-plus', name: 'Qwen 3 Coder Plus', category: 'code', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-coder-flash', name: 'Qwen 3 Coder Flash', category: 'code', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
]

// ── VISION/MULTIMODAL (6) ────────────────────────────────────────────

const VISION_MODELS: G4FModel[] = [
  { id: 'grok-2-vision', name: 'Grok 2 Vision \u2605 SIN CENSURA', category: 'vision', contextLength: 131072, supportsTools: false, supportsVision: true, uncensored: true, isFree: true },
  { id: 'grok-vision-beta', name: 'Grok Vision Beta \u2605 SIN CENSURA', category: 'vision', contextLength: 131072, supportsTools: false, supportsVision: true, uncensored: true, isFree: true },
  { id: 'qwen-3-vl-235b-a22b', name: 'Qwen 3 VL 235B', category: 'vision', contextLength: 262144, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'qwen-3-omni-flash', name: 'Qwen 3 Omni Flash', category: 'vision', contextLength: 262144, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'qwen-vl-max', name: 'Qwen VL Max', category: 'vision', contextLength: 131072, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'qwen-vl-plus', name: 'Qwen VL Plus', category: 'vision', contextLength: 131072, supportsTools: true, supportsVision: true, isFree: true },
]

// ── AUDIO/VOZ (5) ────────────────────────────────────────────────────

const AUDIO_MODELS: G4FModel[] = [
  { id: 'gpt-4o-audio', name: 'GPT-4o Audio', category: 'audio', contextLength: 128000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gpt-4o-mini-audio', name: 'GPT-4o Mini Audio', category: 'audio', contextLength: 128000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gpt-4o-mini-tts', name: 'GPT-4o Mini TTS', category: 'audio', contextLength: 128000, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'openai-audio', name: 'OpenAI Audio', category: 'audio', contextLength: 128000, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'whisperfall', name: 'Whisperfall STT', category: 'audio', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
]

// ── IMAGEN (77 total) ────────────────────────────────────────────────

const IMAGE_MODELS: G4FModel[] = [
  // Flux (20)
  { id: 'flux', name: 'Flux', category: 'image', subcategory: 'flux', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'flux-1-kontext-dev', name: 'Flux 1 Kontext Dev', category: 'image', subcategory: 'flux', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'flux-1-kontext-max', name: 'Flux 1 Kontext Max', category: 'image', subcategory: 'flux', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'flux-1-kontext-pro', name: 'Flux 1 Kontext Pro', category: 'image', subcategory: 'flux', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'flux-2-dev', name: 'Flux 2 Dev', category: 'image', subcategory: 'flux', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'flux-2-flex', name: 'Flux 2 Flex', category: 'image', subcategory: 'flux', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'flux-2-max', name: 'Flux 2 Max', category: 'image', subcategory: 'flux', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'flux-2-pro', name: 'Flux 2 Pro', category: 'image', subcategory: 'flux', contextLength: 0, supportsTools: false, supportsVision: false, realProvider: 'BlackForestLabs', isFree: true },
  { id: 'flux-canny', name: 'Flux Canny', category: 'image', subcategory: 'flux', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'flux-depth', name: 'Flux Depth', category: 'image', subcategory: 'flux', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'flux-dev', name: 'Flux Dev', category: 'image', subcategory: 'flux', contextLength: 0, supportsTools: false, supportsVision: false, realProvider: 'BlackForestLabs', isFree: true },
  { id: 'flux-dev-lora', name: 'Flux Dev LoRA', category: 'image', subcategory: 'flux', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'flux-kontext', name: 'Flux Kontext', category: 'image', subcategory: 'flux', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'flux-kontext-dev', name: 'Flux Kontext Dev', category: 'image', subcategory: 'flux', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'flux-kontext-pro', name: 'Flux Kontext Pro', category: 'image', subcategory: 'flux', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'flux-pro', name: 'Flux Pro', category: 'image', subcategory: 'flux', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'flux-redux', name: 'Flux Redux', category: 'image', subcategory: 'flux', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'flux-schnell', name: 'Flux Schnell', category: 'image', subcategory: 'flux', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'flux.2-dev-turbo', name: 'Flux 2 Dev Turbo', category: 'image', subcategory: 'flux', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'kontext', name: 'Kontext', category: 'image', subcategory: 'flux', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  // GPT Image (8)
  { id: 'chatgpt-image (20251216)', name: 'ChatGPT Image', category: 'image', subcategory: 'gpt-image', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'gpt-5-image', name: 'GPT-5 Image', category: 'image', subcategory: 'gpt-image', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'gpt-5-image-mini', name: 'GPT-5 Image Mini', category: 'image', subcategory: 'gpt-image', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'gpt-image', name: 'GPT Image', category: 'image', subcategory: 'gpt-image', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'gpt-image-1', name: 'GPT Image 1', category: 'image', subcategory: 'gpt-image', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'gpt-image-1-high-fidelity', name: 'GPT Image 1 High Fidelity', category: 'image', subcategory: 'gpt-image', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'gpt-image-1-mini', name: 'GPT Image 1 Mini', category: 'image', subcategory: 'gpt-image', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'gpt-image-1.5', name: 'GPT Image 1.5', category: 'image', subcategory: 'gpt-image', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  // Gemini / Google Imagen (13)
  { id: 'gemini-2.0-flash-preview-image-generation', name: 'Gemini 2.0 Flash Image', category: 'image', subcategory: 'gemini-imagen', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image', category: 'image', subcategory: 'gemini-imagen', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'gemini-2.5-flash-image-preview (nano-banana)', name: 'Nano Banana', category: 'image', subcategory: 'gemini-imagen', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'gemini-3-pro-image', name: 'Gemini 3 Pro Image', category: 'image', subcategory: 'gemini-imagen', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'gemini-3-pro-image-preview (nano-banana-pro)', name: 'Nano Banana Pro', category: 'image', subcategory: 'gemini-imagen', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'gemini-3-pro-image-preview-2k (nano-banana-pro)', name: 'Nano Banana Pro 2K', category: 'image', subcategory: 'gemini-imagen', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'gemini-3-pro-image-preview-4k (nano-banana-pro)', name: 'Nano Banana Pro 4K', category: 'image', subcategory: 'gemini-imagen', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'imagen-3.0-generate', name: 'Imagen 3.0', category: 'image', subcategory: 'gemini-imagen', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'imagen-4.0-fast-generate', name: 'Imagen 4.0 Fast', category: 'image', subcategory: 'gemini-imagen', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'imagen-4.0-generate', name: 'Imagen 4.0', category: 'image', subcategory: 'gemini-imagen', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'imagen-4.0-ultra-generate', name: 'Imagen 4.0 Ultra', category: 'image', subcategory: 'gemini-imagen', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'nanobanana', name: 'NanoBanana', category: 'image', subcategory: 'gemini-imagen', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'nanobanana-pro', name: 'NanoBanana Pro', category: 'image', subcategory: 'gemini-imagen', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  // Qwen Image (9)
  { id: 'qwen-image', name: 'Qwen Image', category: 'image', subcategory: 'qwen-image', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'qwen-image-2512', name: 'Qwen Image 2512', category: 'image', subcategory: 'qwen-image', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'qwen-image-2512-gguf', name: 'Qwen Image 2512 GGUF', category: 'image', subcategory: 'qwen-image', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'qwen-image-2512-lightning', name: 'Qwen Image Lightning', category: 'image', subcategory: 'qwen-image', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'qwen-image-2512-turbo-lora', name: 'Qwen Image Turbo LoRA', category: 'image', subcategory: 'qwen-image', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'qwen-image-edit', name: 'Qwen Image Edit', category: 'image', subcategory: 'qwen-image', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'qwen-image-edit-2511', name: 'Qwen Image Edit 2511', category: 'image', subcategory: 'qwen-image', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'qwen-image-edit-rapid-aio', name: 'Qwen Image Edit Rapid AIO', category: 'image', subcategory: 'qwen-image', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'qwen-image-prompt-extend', name: 'Qwen Image Prompt Extend', category: 'image', subcategory: 'qwen-image', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  // Hunyuan Image (3)
  { id: 'hunyuan-image-2.1', name: 'Hunyuan Image 2.1', category: 'image', subcategory: 'hunyuan', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'hunyuan-image-3.0', name: 'Hunyuan Image 3.0', category: 'image', subcategory: 'hunyuan', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'hunyuan-image-3.0-fal', name: 'Hunyuan Image 3.0 Fal', category: 'image', subcategory: 'hunyuan', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  // Seedream / ByteDance (8)
  { id: 'seed-1.6', name: 'Seed 1.6', category: 'image', subcategory: 'seedream', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'seed-1.6-flash', name: 'Seed 1.6 Flash', category: 'image', subcategory: 'seedream', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'seededit-3.0', name: 'SeedEdit 3.0', category: 'image', subcategory: 'seedream', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'seedream', name: 'Seedream', category: 'image', subcategory: 'seedream', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'seedream-3', name: 'Seedream 3', category: 'image', subcategory: 'seedream', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'seedream-4-high-res-fal', name: 'Seedream 4 High-Res', category: 'image', subcategory: 'seedream', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'seedream-4.5', name: 'Seedream 4.5', category: 'image', subcategory: 'seedream', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'seedream-pro', name: 'Seedream Pro', category: 'image', subcategory: 'seedream', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  // Stable Diffusion — no incluido en stack del usuario
  // Otros imagen (16)
  { id: 'dall-e-3', name: 'DALL-E 3', category: 'image', subcategory: 'otros', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'grok-2-image', name: 'Grok 2 Image \u2605 SIN CENSURA', category: 'image', subcategory: 'otros', contextLength: 0, supportsTools: false, supportsVision: false, uncensored: true, isFree: true },
  { id: 'hazel-gen-2', name: 'Hazel Gen 2', category: 'image', subcategory: 'otros', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'hazel-gen-4', name: 'Hazel Gen 4', category: 'image', subcategory: 'otros', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'hidream-e1.1', name: 'HiDream E1.1', category: 'image', subcategory: 'otros', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'ideogram-v3-quality', name: 'Ideogram V3 Quality', category: 'image', subcategory: 'otros', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'janus-pro-7b-image', name: 'Janus Pro 7B Image', category: 'image', subcategory: 'otros', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'mai-image-1', name: 'MAI Image 1', category: 'image', subcategory: 'otros', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'midijourney', name: 'Midijourney', category: 'image', subcategory: 'otros', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'recraft', name: 'Recraft', category: 'image', subcategory: 'otros', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'reve-v1.1', name: 'Reve V1.1', category: 'image', subcategory: 'otros', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'reve-v1.1-fast', name: 'Reve V1.1 Fast', category: 'image', subcategory: 'otros', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'twinflow-z-image-turbo', name: 'Twinflow Z Image Turbo', category: 'image', subcategory: 'otros', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'vidu-q2-image', name: 'Vidu Q2 Image', category: 'image', subcategory: 'otros', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'z-image', name: 'Z Image', category: 'image', subcategory: 'otros', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'z-image-turbo', name: 'Z Image Turbo', category: 'image', subcategory: 'otros', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
]

// ── VIDEO (15) ───────────────────────────────────────────────────────

const VIDEO_MODELS: G4FModel[] = [
  { id: 'cogvideox-5b', name: 'CogVideoX 5B', category: 'video', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'frame-flow', name: 'Frame Flow', category: 'video', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'hunyuanvideo', name: 'HunyuanVideo', category: 'video', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'hunyuanvideo-1.5', name: 'HunyuanVideo 1.5', category: 'video', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'longcat-video', name: 'Longcat Video', category: 'video', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'mochi-1', name: 'Mochi 1', category: 'video', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'wan-alpha', name: 'Wan Alpha', category: 'video', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'wan2.1-t2v-1.3b', name: 'Wan 2.1 T2V 1.3B', category: 'video', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'wan2.1-t2v-14b', name: 'Wan 2.1 T2V 14B', category: 'video', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'wan2.2-t2v-a14b', name: 'Wan 2.2 T2V A14B', category: 'video', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'wan2.2-t2v-a14b-diffusers', name: 'Wan 2.2 T2V Diffusers', category: 'video', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'wan2.2-ti2v-5b', name: 'Wan 2.2 TI2V 5B', category: 'video', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'wan2.5', name: 'Wan 2.5', category: 'video', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'wan2.5-i2i', name: 'Wan 2.5 Image-to-Image', category: 'video', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'wan2.5-t2i', name: 'Wan 2.5 Text-to-Image', category: 'video', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
]

// ── SEARCH/PERPLEXITY (10) ───────────────────────────────────────────

const SEARCH_MODELS: G4FModel[] = [
  { id: 'llama-3.1-sonar-large-online', name: 'Sonar Large Online', category: 'search', contextLength: 127072, supportsTools: false, supportsVision: false, realProvider: 'Perplexity', isFree: true },
  { id: 'llama-3.1-sonar-small-online', name: 'Sonar Small Online', category: 'search', contextLength: 127072, supportsTools: false, supportsVision: false, realProvider: 'Perplexity', isFree: true },
  { id: 'perplexity', name: 'Perplexity', category: 'search', contextLength: 127072, supportsTools: false, supportsVision: false, realProvider: 'Perplexity', isFree: true },
  { id: 'pplx_pro', name: 'Perplexity Pro', category: 'search', contextLength: 200000, supportsTools: false, supportsVision: false, realProvider: 'Perplexity', isFree: true },
  { id: 'sonar', name: 'Sonar', category: 'search', contextLength: 127072, supportsTools: false, supportsVision: false, realProvider: 'Perplexity', isFree: true },
  { id: 'sonar-deep-research', name: 'Sonar Deep Research', category: 'search', contextLength: 127072, supportsTools: false, supportsVision: false, realProvider: 'Perplexity', isFree: true },
  { id: 'sonar-pro', name: 'Sonar Pro', category: 'search', contextLength: 200000, supportsTools: false, supportsVision: false, realProvider: 'Perplexity', isFree: true },
  { id: 'sonar-pro-search', name: 'Sonar Pro Search', category: 'search', contextLength: 200000, supportsTools: false, supportsVision: false, realProvider: 'Perplexity', isFree: true },
  { id: 'sonar-reasoning', name: 'Sonar Reasoning', category: 'search', contextLength: 127072, supportsTools: false, supportsVision: false, realProvider: 'Perplexity', isFree: true },
  { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro', category: 'search', contextLength: 200000, supportsTools: false, supportsVision: false, realProvider: 'Perplexity', isFree: true },
]


// ── MODELOS ADICIONALES (auto-generados desde G4F_MODELOS_ILIMITADOS) ──

// ── TEXTO ADICIONAL (433) ──
const EXTRA_TEXT_MODELS: G4FModel[] = [
  { id: 'aegis-core', name: 'Aegis Core', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'aion-1.0', name: 'Aion 1.0', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'aion-1.0-mini', name: 'Aion 1.0 Mini', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'aion-rp-llama-3.1-8b', name: 'Aion Rp Llama 3.1 8b', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'airoboros-70b', name: 'Airoboros 70b ★ SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'amazon-nova-experimental-chat', name: 'Amazon Nova Experimental Chat', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'amazon-nova-micro', name: 'Amazon Nova Micro', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'amazon.nova-pro', name: 'Amazon.Nova Pro', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'anonymous-1111', name: 'Anonymous 1111', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'anonymous-1218', name: 'Anonymous 1218', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'anonymous-1221', name: 'Anonymous 1221', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'anonymous-1222', name: 'Anonymous 1222', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'aria', name: 'Aria', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'beluga-0104-1', name: 'Beluga 0104 1', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'beluga-0105-1', name: 'Beluga 0105 1', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'beluga-0105-2', name: 'Beluga 0105 2', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'beluga-1128-1', name: 'Beluga 1128 1', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'beluga-1203-1', name: 'Beluga 1203 1', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'beluga-1203-2', name: 'Beluga 1203 2', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'beluga-1211-2', name: 'Beluga 1211 2', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'beluga-1223-1', name: 'Beluga 1223 1', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'beluga-1223-2', name: 'Beluga 1223 2', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'beluga-1223-3', name: 'Beluga 1223 3', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'beluga-1223-4', name: 'Beluga 1223 4', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'beluga-1229-1', name: 'Beluga 1229 1', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'beluga-1230-1', name: 'Beluga 1230 1', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'blackhawk', name: 'Blackhawk', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'bodybuilder', name: 'Bodybuilder', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'chatgpt-4o', name: 'Chatgpt 4o', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'chickytutor', name: 'Chickytutor', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'claude-2', name: 'Claude 2', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'claude-2.0', name: 'Claude 2.0', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'claude-2.1', name: 'Claude 2.1', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'claude-3-5-haiku', name: 'Claude 3 5 Haiku', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'claude-3-5-sonnet', name: 'Claude 3 5 Sonnet', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'claude-3-7-sonnet', name: 'Claude 3 7 Sonnet', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'claude-3.5-haiku', name: 'Claude 3.5 Haiku', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'claude-4-opus', name: 'Claude 4 Opus', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'claude-4-sonnet', name: 'Claude 4 Sonnet', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'claude-haiku-4-5', name: 'Claude Haiku 4 5', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'claude-opus-4', name: 'Claude Opus 4', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'claude-opus-4-1', name: 'Claude Opus 4 1', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'claude-opus-4-5', name: 'Claude Opus 4 5', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4 5', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'cogilux', name: 'Cogilux', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'cogito-v2-preview-llama-109b-moe', name: 'Cogito V2 Preview Llama 109b Moe', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'cogito-v2-preview-llama-405b', name: 'Cogito V2 Preview Llama 405b', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'cogito-v2-preview-llama-70b', name: 'Cogito V2 Preview Llama 70b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'cogito-v2.1-671b', name: 'Cogito V2.1 671b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'command', name: 'Command', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'command-a', name: 'Command A', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'command-a25', name: 'Command A25', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'command-r', name: 'Command R', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'command-r-plus', name: 'Command R Plus', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'command-r-plus24', name: 'Command R Plus24', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'command-r24', name: 'Command R24', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'command-r7b', name: 'Command R7b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'command-r7b-arabic25', name: 'Command R7b Arabic25', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'command-r7b24', name: 'Command R7b24', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'cydonia-24b-v4.1', name: 'Cydonia 24b V4.1 ★ SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'dark-dragon', name: 'Dark Dragon ★ SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'december-chatbot3', name: 'December Chatbot3', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deephermes-3-24b', name: 'Deephermes 3 24b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deephermes-3-8b', name: 'Deephermes 3 8b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deephermes-3-mistral-24b', name: 'Deephermes 3 Mistral 24b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek', name: 'DeepSeek', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-chat', name: 'DeepSeek Chat', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-chat-v3-0324', name: 'DeepSeek Chat V3 0324', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-chat-v3.1', name: 'DeepSeek Chat V3.1', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-ocr', name: 'DeepSeek Ocr', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-prover', name: 'DeepSeek Prover', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-prover-v2', name: 'DeepSeek Prover V2', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-v3', name: 'DeepSeek V3', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-v3-0324', name: 'DeepSeek V3 0324', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-v3.1', name: 'DeepSeek V3.1', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-v3.1-nex-n1', name: 'DeepSeek V3.1 Nex N1', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-v3.1-terminus', name: 'DeepSeek V3.1 Terminus', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-v3.2', name: 'DeepSeek V3.2', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'dolphin-2.6', name: 'Dolphin 2.6 ★ SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'dolphin-2.9', name: 'Dolphin 2.9 ★ SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'dolphin-3.0-24b', name: 'Dolphin 3.0 24b ★ SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'dolphin-3.0-r1-24b', name: 'Dolphin 3.0 R1 24b ★ SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'dolphin-8x22b', name: 'Dolphin 8x22b ★ SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'dolphin-mistral-24b-venice-edition', name: 'Dolphin Mistral 24b Venice Edition ★ SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'eb45-turbo', name: 'Eb45 Turbo', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ernie-4.5-21b-a3b', name: 'Ernie 4.5 21b A3b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ernie-4.5-300b-a47b', name: 'Ernie 4.5 300b A47b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ernie-5.0-preview-1103', name: 'Ernie 5.0 Preview 1103', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ernie-5.0-preview-1120', name: 'Ernie 5.0 Preview 1120', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ernie-5.0-preview-1203', name: 'Ernie 5.0 Preview 1203', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ernie-5.0-preview-1220', name: 'Ernie 5.0 Preview 1220', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ernie-exp-251023', name: 'Ernie Exp 251023', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ernie-exp-251024', name: 'Ernie Exp 251024', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ernie-exp-251025', name: 'Ernie Exp 251025', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ernie-exp-251026', name: 'Ernie Exp 251026', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ernie-exp-251027', name: 'Ernie Exp 251027', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'evo-logic', name: 'Evo Logic', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'fire-bird', name: 'Fire Bird', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'flying-octopus', name: 'Flying Octopus', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gauss', name: 'Gauss', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gemini-1.5-8b-flash', name: 'Gemini 1.5 8b Flash', category: 'text', contextLength: 1000000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', category: 'text', contextLength: 1000000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', category: 'text', contextLength: 1000000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gemini-2.0', name: 'Gemini 2.0', category: 'text', contextLength: 1000000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', category: 'text', contextLength: 1000000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Exp', category: 'text', contextLength: 1000000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', category: 'text', contextLength: 1000000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', category: 'text', contextLength: 1000000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', category: 'text', contextLength: 1000000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gemini-2.5-flash-lite-preview25', name: 'Gemini 2.5 Flash Lite Preview25', category: 'text', contextLength: 1000000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gemini-2.5-flash-preview25', name: 'Gemini 2.5 Flash Preview25', category: 'text', contextLength: 1000000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', category: 'text', contextLength: 1000000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gemini-2.5-pro-grounding-exp', name: 'Gemini 2.5 Pro Grounding Exp', category: 'text', contextLength: 1000000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gemma-1.1-7b', name: 'Gemma 1.1 7b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gemma-2-27b', name: 'Gemma 2 27b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gemma-2-27b-it', name: 'Gemma 2 27b It', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gemma-2-2b-it', name: 'Gemma 2 2b It', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gemma-2-9b', name: 'Gemma 2 9b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gemma-2-9b-it', name: 'Gemma 2 9b It', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gemma-3-12b', name: 'Gemma 3 12b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gemma-3-12b-it', name: 'Gemma 3 12b It', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gemma-3-1b', name: 'Gemma 3 1b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gemma-3-27b', name: 'Gemma 3 27b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gemma-3-27b-it', name: 'Gemma 3 27b It', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gemma-3-4b', name: 'Gemma 3 4b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gemma-3-4b-it', name: 'Gemma 3 4b It', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gemma-3n-e2b-it', name: 'Gemma 3n E2b It', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gemma-3n-e4b', name: 'Gemma 3n E4b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gemma-3n-e4b-it', name: 'Gemma 3n E4b It', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'glm-4', name: 'GLM 4', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'glm-4-32b', name: 'GLM 4 32b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'glm-4-9b', name: 'GLM 4 9b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'glm-4.5', name: 'GLM 4.5', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'glm-4.5-air', name: 'GLM 4.5 Air', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'glm-4.5v', name: 'GLM 4.5v', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'glm-4.6', name: 'GLM 4.6', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'glm-4.6v', name: 'GLM 4.6v', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'glm-4.6v-flash', name: 'GLM 4.6v Flash', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'glm-z1-32b', name: 'GLM Z1 32b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'glm-z1-9b', name: 'GLM Z1 9b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'glm-z1-rumination-32b', name: 'GLM Z1 Rumination 32b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'goliath-120b', name: 'Goliath 120b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-3.5-turbo', name: 'GPT 3.5 Turbo', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-3.5-turbo-0613', name: 'GPT 3.5 Turbo 0613', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-3.5-turbo-16k', name: 'GPT 3.5 Turbo 16k', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-4', name: 'GPT 4', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-4-0314', name: 'GPT 4 0314', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-4-1106', name: 'GPT 4 1106', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-4-turbo', name: 'GPT 4 Turbo', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-4.1', name: 'GPT 4.1', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-4.1-mini', name: 'GPT 4.1 Mini', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-4.1-nano', name: 'GPT 4.1 Nano', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-4.5', name: 'GPT 4.5', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-4o-mini', name: 'GPT 4o Mini', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-5', name: 'GPT 5', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-5-chat', name: 'GPT 5 Chat', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-5-codex', name: 'GPT 5 Codex', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-5-high', name: 'GPT 5 High', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-5-high-new-system-prompt', name: 'GPT 5 High New System Prompt', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-5-high-no-system-prompt', name: 'GPT 5 High No System Prompt', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-5-instant', name: 'GPT 5 Instant', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-5-mini', name: 'GPT 5 Mini', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-5-mini-high', name: 'GPT 5 Mini High', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-5-nano', name: 'GPT 5 Nano', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-5-nano-high', name: 'GPT 5 Nano High', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-5-pro', name: 'GPT 5 Pro', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-5.1', name: 'GPT 5.1', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-5.1-chat', name: 'GPT 5.1 Chat', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-5.1-codex', name: 'GPT 5.1 Codex', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-5.1-codex-mini', name: 'GPT 5.1 Codex Mini', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-5.1-high', name: 'GPT 5.1 High', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-5.1-instant', name: 'GPT 5.1 Instant', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-5.2', name: 'GPT 5.2', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gpt-5.2-chat', name: 'GPT 5.2 Chat', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gpt-5.2-high', name: 'GPT 5.2 High', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gpt-5.2-high-no-system-prompt', name: 'GPT 5.2 High No System Prompt', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gpt-5.2-instant', name: 'GPT 5.2 Instant', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gpt-5.2-no-system-prompt', name: 'GPT 5.2 No System Prompt', category: 'text', contextLength: 200000, supportsTools: true, supportsVision: true, isFree: true },
  { id: 'gpt-oss-20b', name: 'GPT Oss 20b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'gpt-oss-safeguard-20b', name: 'GPT Oss Safeguard 20b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'granite-4.0-h-micro', name: 'Granite 4.0 H Micro', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'grok', name: 'Grok ★ SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'grok-2', name: 'Grok 2 ★ SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'grok-3', name: 'Grok 3 ★ SIN CENSURA', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'grok-3-beta', name: 'Grok 3 Beta ★ SIN CENSURA', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'grok-3-fast', name: 'Grok 3 Fast ★ SIN CENSURA', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'grok-3-mini', name: 'Grok 3 Mini ★ SIN CENSURA', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'grok-3-mini-beta', name: 'Grok 3 Mini Beta ★ SIN CENSURA', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'grok-3-mini-fast', name: 'Grok 3 Mini Fast ★ SIN CENSURA', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'grok-3-mini-high', name: 'Grok 3 Mini High ★ SIN CENSURA', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'grok-3-r1', name: 'Grok 3 R1 ★ SIN CENSURA', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'grok-4', name: 'Grok 4 ★ SIN CENSURA', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'grok-4-0709', name: 'Grok 4 0709 ★ SIN CENSURA', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'grok-4-fast-chat', name: 'Grok 4 Fast Chat ★ SIN CENSURA', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'grok-4-heavy', name: 'Grok 4 Heavy ★ SIN CENSURA', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'grok-4.1', name: 'Grok 4.1 ★ SIN CENSURA', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'grok-4.1-fast', name: 'Grok 4.1 Fast ★ SIN CENSURA', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'grok-beta', name: 'Grok Beta ★ SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'grok-fast', name: 'Grok Fast ★ SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'hermes-2-dpo', name: 'Hermes 2 Dpo ★ SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'hermes-2-pro', name: 'Hermes 2 Pro', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'hermes-2-pro-llama-3-8b', name: 'Hermes 2 Pro Llama 3 8b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'hermes-3-405b', name: 'Hermes 3 405b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'hermes-3-70b', name: 'Hermes 3 70b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'hermes-3-llama-3.1-405b', name: 'Hermes 3 Llama 3.1 405b', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'hermes-3-llama-3.1-70b', name: 'Hermes 3 Llama 3.1 70b', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'hermes-4-405b', name: 'Hermes 4 405b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'hermes-4-70b', name: 'Hermes 4 70b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'hunyuan-a13b', name: 'Hunyuan A13b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'hunyuan-t1', name: 'Hunyuan T1', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ibm-granite-h-small', name: 'Ibm Granite H Small', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'inflection-3-pi', name: 'Inflection 3 Pi', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'inflection-3-productivity', name: 'Inflection 3 Productivity', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'integrated-info', name: 'Integrated Info', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'intellect-3', name: 'Intellect 3', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'jakiro', name: 'Jakiro', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'jamba-large-1.7', name: 'Jamba Large 1.7', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'jamba-mini-1.7', name: 'Jamba Mini 1.7', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'january26-chatbot1', name: 'January26 Chatbot1', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'january26-chatbot2', name: 'January26 Chatbot2', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'janus-pro-7b', name: 'Janus Pro 7b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'kimi-k2', name: 'Kimi K2', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'kimi-k2-0711', name: 'Kimi K2 0711', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'kiwi-do', name: 'Kiwi Do', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'l3-euryale-70b', name: 'L3 Euryale 70b ★ SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'l3-lunaris-8b', name: 'L3 Lunaris 8b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'l3.1-70b-hanami-x1', name: 'L3.1 70b Hanami X1', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'l3.1-euryale-70b', name: 'L3.1 Euryale 70b ★ SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'l3.3-euryale-70b', name: 'L3.3 Euryale 70b ★ SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'leepwal', name: 'Leepwal', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'lfm-2.2-6b', name: 'Lfm 2.2 6b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'lfm-3b', name: 'Lfm 3b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'lfm-40b', name: 'Lfm 40b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'lfm-7b', name: 'Lfm 7b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'lfm2-8b-a1b', name: 'Lfm2 8b A1b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ling', name: 'Ling', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ling-1t', name: 'Ling 1t', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ling-1t-1031', name: 'Ling 1t 1031', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ling-flash-2.0', name: 'Ling Flash 2.0', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ling-mini-2.0', name: 'Ling Mini 2.0', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-2-70b', name: 'Llama 2 70b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-3', name: 'Llama 3', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-3-70b', name: 'Llama 3 70b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-3-8b', name: 'Llama 3 8b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-3.1-405b', name: 'Llama 3.1 405b', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-3.1-70b', name: 'Llama 3.1 70b', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-3.1-8b', name: 'Llama 3.1 8b', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-3.1-lumimaid-8b', name: 'Llama 3.1 Lumimaid 8b', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-3.1-nemotron-70b', name: 'Llama 3.1 Nemotron 70b', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-3.1-nemotron-ultra-253b', name: 'Llama 3.1 Nemotron Ultra 253b', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-3.2-11b', name: 'Llama 3.2 11b', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-3.2-1b', name: 'Llama 3.2 1b', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-3.2-3b', name: 'Llama 3.2 3b', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-3.2-90b', name: 'Llama 3.2 90b', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-3.3-70b', name: 'Llama 3.3 70b', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-3.3-8b', name: 'Llama 3.3 8b', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-3.3-nemotron-super-49b-v1.5', name: 'Llama 3.3 Nemotron Super 49b V1.5', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-4-maverick', name: 'Llama 4 Maverick', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-4-maverick-17b-128e', name: 'Llama 4 Maverick 17b 128e', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-4-maverick-17b-128e-turbo', name: 'Llama 4 Maverick 17b 128e Turbo', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-4-scout', name: 'Llama 4 Scout', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-4-scout-17b-16e', name: 'Llama 4 Scout 17b 16e', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-guard-2-8b', name: 'Llama Guard 2 8b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-guard-3-8b', name: 'Llama Guard 3 8b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llama-guard-4-12b', name: 'Llama Guard 4 12b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'llemma.7b', name: 'Llemma.7b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'lmarena-internal-test-only', name: 'Lmarena Internal Test Only', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'lmarena-text-gg', name: 'Lmarena Text Gg', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'lucid-origin', name: 'Lucid Origin', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'lzlv-70b', name: 'Lzlv 70b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'magistral-medium-2506', name: 'Magistral Medium 2506', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'magistral-medium-2509', name: 'Magistral Medium 2509', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'magistral-small-2509', name: 'Magistral Small 2509', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'magnum-v4-72b', name: 'Magnum V4 72b ★ SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'mai-ds-r1', name: 'Mai Ds R1', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'master-node', name: 'Master Node', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mercury', name: 'Mercury', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'meta-ai', name: 'Meta AI', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mimo-7b', name: 'Mimo 7b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mimo-v2-flash', name: 'Mimo V2 Flash', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'minimax', name: 'Minimax', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'minimax-01', name: 'Minimax 01', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'minimax-m1', name: 'Minimax M1', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'minimax-m2', name: 'Minimax M2', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'minimax-m2.1', name: 'Minimax M2.1', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'minimax-m2.7', name: 'Minimax M2.7', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ministral-14b-2512', name: 'Ministral 14b 2512', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ministral-3b', name: 'Ministral 3b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ministral-3b-2512', name: 'Ministral 3b 2512', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ministral-8b', name: 'Ministral 8b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ministral-8b-2512', name: 'Ministral 8b 2512', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-7b', name: 'Mistral 7b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-7b-v0.1', name: 'Mistral 7b V0.1', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-7b-v0.2', name: 'Mistral 7b V0.2', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-7b-v0.3', name: 'Mistral 7b V0.3', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-large', name: 'Mistral Large', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-large-2407', name: 'Mistral Large 2407', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-large-2411', name: 'Mistral Large 2411', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-large-2512', name: 'Mistral Large 2512', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-large-3', name: 'Mistral Large 3', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-medium-2505', name: 'Mistral Medium 2505', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-medium-2508', name: 'Mistral Medium 2508', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-medium-3', name: 'Mistral Medium 3', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-medium-3.1', name: 'Mistral Medium 3.1', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-nemo', name: 'Mistral Nemo', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-nemo-2407', name: 'Mistral Nemo 2407', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-saba', name: 'Mistral Saba', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-small', name: 'Mistral Small', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-small-24b', name: 'Mistral Small 24b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-small-24b-2501', name: 'Mistral Small 24b 2501', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-small-2506', name: 'Mistral Small 2506', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-small-3.1-24b', name: 'Mistral Small 3.1 24b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-small-3.1-24b-2503', name: 'Mistral Small 3.1 24b 2503', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-small-3.2-24b', name: 'Mistral Small 3.2 24b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-small-3.2-24b-2506', name: 'Mistral Small 3.2 24b 2506', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-small-creative', name: 'Mistral Small Creative', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mistral-tiny', name: 'Mistral Tiny', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mixtral-8x22b', name: 'Mixtral 8x22b', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mixtral-8x7b', name: 'Mixtral 8x7b', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'monster', name: 'Monster', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'monterey', name: 'Monterey', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'moonlight-16b', name: 'Moonlight 16b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'morph-v3-large', name: 'Morph V3 Large', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mythomax-l2-13b', name: 'Mythomax L2 13b ★ SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'nemotron-253b', name: 'Nemotron 253b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'nemotron-3-nano-30b-a3b', name: 'Nemotron 3 Nano 30b A3b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'nemotron-49b', name: 'Nemotron 49b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'nemotron-70b', name: 'Nemotron 70b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'nemotron-nano-9b', name: 'Nemotron Nano 9b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'neo-nucleus', name: 'Neo Nucleus', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'neon', name: 'Neon', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'newton', name: 'Newton', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'nightride-on', name: 'Nightride On', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'noromaid-20b', name: 'Noromaid 20b ★ SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'not-a-new-model', name: 'Not A New Model', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'nova-2-lite', name: 'Nova 2 Lite', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'nova-lite', name: 'Nova Lite', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'nova-micro', name: 'Nova Micro', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'nova-premier', name: 'Nova Premier', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'nova-pro', name: 'Nova Pro', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'nvidia-nemotron-3-nano-30b-a3b', name: 'Nvidia Nemotron 3 Nano 30b A3b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'olmo-2-0325-32b', name: 'Olmo 2 0325 32b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'olmo-3-32b-think', name: 'Olmo 3 32b Think', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'olmo-3-7b', name: 'Olmo 3 7b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'olmo-3-7b-think', name: 'Olmo 3 7b Think', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'olmo-3.1-32b', name: 'Olmo 3.1 32b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'olmo-3.1-32b-think', name: 'Olmo 3.1 32b Think', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'omg-wow', name: 'Omg Wow', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'open-mistral-7b', name: 'Open Mistral 7b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'open-mistral-nemo', name: 'Open Mistral Nemo', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'openai', name: 'Openai', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'phantom-1203-1', name: 'Phantom 1203 1', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'phantom-mm-1125-1', name: 'Phantom Mm 1125 1', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'phi-3-medium', name: 'Phi 3 Medium', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'phi-3-mini', name: 'Phi 3 Mini', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'phi-3.5-mini', name: 'Phi 3.5 Mini', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'phi-4', name: 'Phi 4', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'photon', name: 'Photon', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'proto-think', name: 'Proto Think', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-2-72b', name: 'Qwen 2 72b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-2.5', name: 'Qwen 2.5', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-2.5-14b-1m', name: 'Qwen 2.5 14b 1m', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-2.5-1m', name: 'Qwen 2.5 1m', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-2.5-72b', name: 'Qwen 2.5 72b', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-2.5-7b', name: 'Qwen 2.5 7b', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-2.5-max', name: 'Qwen 2.5 Max', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-2.5-omni-7b', name: 'Qwen 2.5 Omni 7b', category: 'text', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-0.6b', name: 'Qwen 3 0.6b', category: 'text', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-1.7b', name: 'Qwen 3 1.7b', category: 'text', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-14b', name: 'Qwen 3 14b', category: 'text', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-235b', name: 'Qwen 3 235b', category: 'text', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-235b-a22b', name: 'Qwen 3 235b A22b', category: 'text', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-30b', name: 'Qwen 3 30b', category: 'text', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-30b-a3b', name: 'Qwen 3 30b A3b', category: 'text', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-30b-a3b-2507', name: 'Qwen 3 30b A3b 2507', category: 'text', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-32b', name: 'Qwen 3 32b', category: 'text', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-4b', name: 'Qwen 3 4b', category: 'text', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-4b-2507', name: 'Qwen 3 4b 2507', category: 'text', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-8b', name: 'Qwen 3 8b', category: 'text', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-coder', name: 'Qwen 3 Coder', category: 'text', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-coder-30b-a3b', name: 'Qwen 3 Coder 30b A3b', category: 'text', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-3-next-80b-a3b', name: 'Qwen 3 Next 80b A3b', category: 'text', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-max', name: 'Qwen Max', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-plus', name: 'Qwen Plus', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-turbo', name: 'Qwen Turbo', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwerky-72b', name: 'Qwerky 72b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'r1-1776', name: 'R1 1776', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'rain-drop', name: 'Rain Drop', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'raptor', name: 'Raptor', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'raptor-0107', name: 'Raptor 0107', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'raptor-1.8-1208', name: 'Raptor 1.8 1208', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'raptor-1119', name: 'Raptor 1119', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'raptor-1123', name: 'Raptor 1123', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'raptor-1124', name: 'Raptor 1124', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'raptor-llm-1024', name: 'Raptor Llm 1024', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'raptor-llm-1205', name: 'Raptor Llm 1205', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'redwood', name: 'Redwood', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'reka-flash', name: 'Reka Flash', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'remm-slerp-l2-13b', name: 'Remm Slerp L2 13b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ring-1t', name: 'Ring 1t', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ring-flash-2.0', name: 'Ring Flash 2.0', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'ring-mini-2.0', name: 'Ring Mini 2.0', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'rnj-1', name: 'Rnj 1', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'rocinante-12b', name: 'Rocinante 12b ★ SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'skyfall-36b', name: 'Skyfall 36b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'sorcererlm-8x22b', name: 'Sorcererlm 8x22b ★ SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'spotlight', name: 'Spotlight', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'step-3', name: 'Step 3', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'step-3-mini-2511', name: 'Step 3 Mini 2511', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'step3', name: 'Step3', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'stephen', name: 'Stephen', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'study', name: 'Study', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'sunshine-ai', name: 'Sunshine AI', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'tangerine', name: 'Tangerine', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'tng-r1t-chimera', name: 'Tng R1t Chimera', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'trinity-mini', name: 'Trinity Mini', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'turbo', name: 'Turbo', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'unslopnemo-12b', name: 'Unslopnemo 12b ★ SIN CENSURA', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, uncensored: true, isFree: true },
  { id: 'viper', name: 'Viper', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'virtuoso-large', name: 'Virtuoso Large', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'weaver', name: 'Weaver', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'winter-wind', name: 'Winter Wind', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'wizardlm-2-7b', name: 'Wizardlm 2 7b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'wizardlm-2-8x22b', name: 'Wizardlm 2 8x22b', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'x1-1-preview-0915', name: 'X1 1 Preview 0915', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'x1-turbo-0906', name: 'X1 Turbo 0906', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'xAI', name: 'XAI', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'zeta-chroma', name: 'Zeta Chroma', category: 'text', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
]

// ── THINKING ADICIONAL (16) ──
const EXTRA_THINKING_MODELS: G4FModel[] = [
  { id: 'deepseek-r1', name: 'DeepSeek R1', category: 'thinking', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-r1-0528', name: 'DeepSeek R1 0528', category: 'thinking', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-r1-0528-qwen-3-8b', name: 'DeepSeek R1 0528 Qwen 3 8b', category: 'thinking', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-r1-0528-turbo', name: 'DeepSeek R1 0528 Turbo', category: 'thinking', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-r1-distill-llama-8b', name: 'DeepSeek R1 Distill Llama 8b', category: 'thinking', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-r1-distill-qwen-1.5b', name: 'DeepSeek R1 Distill Qwen 1.5b', category: 'thinking', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-r1-distill-qwen-14b', name: 'DeepSeek R1 Distill Qwen 14b', category: 'thinking', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-r1-distill-qwen-32b', name: 'DeepSeek R1 Distill Qwen 32b', category: 'thinking', contextLength: 262144, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-r1-turbo', name: 'DeepSeek R1 Turbo', category: 'thinking', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-r1-zero', name: 'DeepSeek R1 Zero', category: 'thinking', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-r1t-chimera', name: 'DeepSeek R1t Chimera', category: 'thinking', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'o1-mini', name: 'O1 Mini', category: 'thinking', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'o3-mini', name: 'O3 Mini', category: 'thinking', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'o3-mini-high', name: 'O3 Mini High', category: 'thinking', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'o4-mini', name: 'O4 Mini', category: 'thinking', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'o4-mini-high', name: 'O4 Mini High', category: 'thinking', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
]

// ── CÓDIGO ADICIONAL (18) ──
const EXTRA_CODE_MODELS: G4FModel[] = [
  { id: 'codegemma-7b', name: 'Codegemma 7b', category: 'code', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'codellama-7b-solidity', name: 'Codellama 7b Solidity', category: 'code', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'coder-large', name: 'Coder Large', category: 'code', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'codestral-2508', name: 'Codestral 2508', category: 'code', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'codex-mini', name: 'Codex Mini', category: 'code', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepcoder-14b', name: 'Deepcoder 14b', category: 'code', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'deepseek-coder', name: 'DeepSeek Coder', category: 'code', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'devstral-2512', name: 'Devstral 2512', category: 'code', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'devstral-medium', name: 'Devstral Medium', category: 'code', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'devstral-medium-2507', name: 'Devstral Medium 2507', category: 'code', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'devstral-small', name: 'Devstral Small', category: 'code', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'devstral-small-2505', name: 'Devstral Small 2505', category: 'code', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'devstral-small-2507', name: 'Devstral Small 2507', category: 'code', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'kat-coder-pro', name: 'Kat Coder Pro', category: 'code', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'mercury-coder', name: 'Mercury Coder', category: 'code', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder 32b', category: 'code', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'qwen-2.5-coder-7b', name: 'Qwen 2.5 Coder 7b', category: 'code', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true },
  { id: 'relace-apply-3', name: 'Relace Apply 3', category: 'code', contextLength: 128000, supportsTools: true, supportsVision: false, isFree: true },
]

// ── VISION ADICIONAL (29) ──
const EXTRA_VISION_MODELS: G4FModel[] = [
  { id: 'eb45-turbo-vl-0906', name: 'Eb45 Turbo VL 0906', category: 'vision', contextLength: 128000, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'eb45-vision', name: 'Eb45 Vision', category: 'vision', contextLength: 128000, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'ernie-4.5-vl-28b-a3b', name: 'Ernie 4.5 VL 28b A3b', category: 'vision', contextLength: 128000, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'ernie-4.5-vl-424b-a47b', name: 'Ernie 4.5 VL 424b A47b', category: 'vision', contextLength: 128000, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'ernie-exp-vl-251016', name: 'Ernie Exp VL 251016', category: 'vision', contextLength: 128000, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'internvl3-78b', name: 'Internvl3 78b', category: 'vision', contextLength: 128000, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'llama-3.2-11b-vision', name: 'Llama 3.2 11b Vision', category: 'vision', contextLength: 131072, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'llama-3.2-90b-vision', name: 'Llama 3.2 90b Vision', category: 'vision', contextLength: 131072, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'mimo-vl-7b-rl-2508', name: 'Mimo VL 7b RL 2508', category: 'vision', contextLength: 128000, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'nemotron-nano-12b-v2-vl', name: 'Nemotron Nano 12b V2 Vl', category: 'vision', contextLength: 128000, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'olmocr-2-7b-1025', name: 'Olmocr 2 7b 1025', category: 'vision', contextLength: 128000, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'paddleocr-vl-0.9b', name: 'Paddleocr VL 0.9b', category: 'vision', contextLength: 128000, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'phi-4-multimodal', name: 'Phi 4 Multimodal', category: 'vision', contextLength: 128000, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'pixtral-12b', name: 'Pixtral 12b', category: 'vision', contextLength: 128000, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'pixtral-large', name: 'Pixtral Large', category: 'vision', contextLength: 128000, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'pixtral-large-2411', name: 'Pixtral Large 2411', category: 'vision', contextLength: 128000, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'qwen-2-vl-72b', name: 'Qwen 2 VL 72b', category: 'vision', contextLength: 128000, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'qwen-2-vl-7b', name: 'Qwen 2 VL 7b', category: 'vision', contextLength: 128000, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'qwen-2.5-vl-32b', name: 'Qwen 2.5 VL 32b', category: 'vision', contextLength: 131072, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'qwen-2.5-vl-3b', name: 'Qwen 2.5 VL 3b', category: 'vision', contextLength: 131072, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'qwen-2.5-vl-72b', name: 'Qwen 2.5 VL 72b', category: 'vision', contextLength: 131072, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'qwen-2.5-vl-7b', name: 'Qwen 2.5 VL 7b', category: 'vision', contextLength: 131072, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'qwen-3-vl-30b-a3b', name: 'Qwen 3 VL 30b A3b', category: 'vision', contextLength: 262144, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'qwen-3-vl-32b', name: 'Qwen 3 VL 32b', category: 'vision', contextLength: 262144, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'qwen-3-vl-8b', name: 'Qwen 3 VL 8b', category: 'vision', contextLength: 262144, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'raptor-vision-1015', name: 'Raptor Vision 1015', category: 'vision', contextLength: 128000, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'raptor-vision-1107', name: 'Raptor Vision 1107', category: 'vision', contextLength: 128000, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'stephen-vision-csfix', name: 'Stephen Vision Csfix', category: 'vision', contextLength: 128000, supportsTools: false, supportsVision: true, isFree: true },
  { id: 'ui-tars-1.5-7b', name: 'Ui Tars 1.5 7b', category: 'vision', contextLength: 128000, supportsTools: false, supportsVision: true, isFree: true },
]

// ── AUDIO ADICIONAL (3) ──
const EXTRA_AUDIO_MODELS: G4FModel[] = [
  { id: 'voxtral-mini-2507', name: 'Voxtral Mini 2507', category: 'audio', contextLength: 128000, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'voxtral-small-24b-2507', name: 'Voxtral Small 24b 2507', category: 'audio', contextLength: 128000, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'voxtral-small-2507', name: 'Voxtral Small 2507', category: 'audio', contextLength: 128000, supportsTools: false, supportsVision: false, isFree: true },
]

// ── IMAGEN ADICIONAL (6) ──
const EXTRA_IMAGE_MODELS: G4FModel[] = [
  { id: 'micro-mango', name: 'Micro Mango', category: 'image', subcategory: 'otros', contextLength: 128000, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'sd-3.5-large', name: 'SD 3.5 Large', category: 'image', subcategory: 'stable-diffusion', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'sdxl-1.0', name: 'SDXL 1.0', category: 'image', subcategory: 'stable-diffusion', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'sdxl-turbo', name: 'SDXL Turbo', category: 'image', subcategory: 'stable-diffusion', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'stable-diffusion-3.5-large', name: 'Stable Diffusion 3.5 Large', category: 'image', subcategory: 'stable-diffusion', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'stable-diffusion-xl-base-1.0', name: 'Stable Diffusion Xl Base 1.0', category: 'image', subcategory: 'stable-diffusion', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
]

// ── VIDEO ADICIONAL (2) ──
const EXTRA_VIDEO_MODELS: G4FModel[] = [
  { id: 'longcat-flash-chat', name: 'Longcat Flash Chat', category: 'video', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'video', name: 'Video', category: 'video', contextLength: 0, supportsTools: false, supportsVision: false, isFree: true },
]

// ── SEARCH ADICIONAL (3) ──
const EXTRA_SEARCH_MODELS: G4FModel[] = [
  { id: 'gpt-4o-mini-search', name: 'GPT 4o Mini Search', category: 'search', contextLength: 128000, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'gpt-4o-search', name: 'GPT 4o Search', category: 'search', contextLength: 128000, supportsTools: false, supportsVision: false, isFree: true },
  { id: 'relace-search', name: 'Relace Search', category: 'search', contextLength: 128000, supportsTools: false, supportsVision: false, isFree: true },
]

// ══════════════════════════════════════════════════════════════════════
//  CATÁLOGO UNIFICADO
// ══════════════════════════════════════════════════════════════════════

export const G4F_CATALOG: G4FModel[] = [
  ...TEXT_MODELS,
  ...EXTRA_TEXT_MODELS,
  ...THINKING_MODELS,
  ...EXTRA_THINKING_MODELS,
  ...RESEARCH_MODELS,
  ...CODE_MODELS,
  ...EXTRA_CODE_MODELS,
  ...VISION_MODELS,
  ...EXTRA_VISION_MODELS,
  ...AUDIO_MODELS,
  ...EXTRA_AUDIO_MODELS,
  ...IMAGE_MODELS,
  ...EXTRA_IMAGE_MODELS,
  ...VIDEO_MODELS,
  ...EXTRA_VIDEO_MODELS,
  ...SEARCH_MODELS,
  ...EXTRA_SEARCH_MODELS,
]

// ── Funciones de consulta ────────────────────────────────────────────

export function getModelsByCategory(category: G4FModelCategory): G4FModel[] {
  return G4F_CATALOG.filter(m => m.category === category)
}

export function getChatModels(): G4FModel[] {
  return G4F_CATALOG.filter(m =>
    m.category === 'text' ||
    m.category === 'thinking' ||
    m.category === 'research' ||
    m.category === 'code' ||
    m.category === 'vision' ||
    m.category === 'audio' ||
    m.category === 'search'
  )
}

export function getImageModels(): G4FModel[] {
  return IMAGE_MODELS
}

export function getVideoModels(): G4FModel[] {
  return VIDEO_MODELS
}

export function getAudioModels(): G4FModel[] {
  return AUDIO_MODELS
}

export function getG4FModelCategory(modelId: string): G4FModelCategory | null {
  const model = G4F_CATALOG.find(m => m.id === modelId)
  return model?.category ?? null
}

export function findG4FModel(modelId: string): G4FModel | undefined {
  return G4F_CATALOG.find(m => m.id === modelId)
}

// ── Mapa de categorías a labels UI ──────────────────────────────────

export const CATEGORY_LABELS: Record<G4FModelCategory, string> = {
  text: 'Texto Flagship',
  thinking: 'Thinking / Reasoning',
  research: 'Deep Research',
  code: 'Codigo',
  vision: 'Vision / Multimodal',
  audio: 'Audio / Voz',
  image: 'Imagen',
  video: 'Video',
  search: 'Search / Perplexity',
}

export const IMAGE_SUBCATEGORY_LABELS: Record<string, string> = {
  'flux': 'Flux',
  'gpt-image': 'GPT Image',
  'gemini-imagen': 'Gemini / Google Imagen',
  'qwen-image': 'Qwen Image',
  'hunyuan': 'Hunyuan Image',
  'seedream': 'Seedream / ByteDance',
  'otros': 'Otros',
}

// ══════════════════════════════════════════════════════════════════════
//  BACKWARD-COMPAT — PROVIDERS[] (para RouterMetrics y chat-runtime)
// ══════════════════════════════════════════════════════════════════════

function g4fToModelInfo(m: G4FModel): ModelInfo {
  return {
    id: m.id,
    name: m.name,
    contextLength: m.contextLength,
    supportsTools: m.supportsTools,
    supportsVision: m.supportsVision,
    isFree: true,
    authMode: 'none',
    stability: 'stable',
    uncensored: m.uncensored,
    category: m.category,
    subcategory: m.subcategory,
  }
}

const G4F_UNLIMITED_MODELS: ModelInfo[] = getChatModels().map(g4fToModelInfo)

// ── Modelos de cuentas PRO (OAuth) — Claude Pro + ChatGPT Plus ──────────────

const CLAUDE_PRO_MODELS: ModelInfo[] = [
  {
    id: 'account-anthropic:claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    contextLength: 200000,
    supportsTools: true,
    supportsVision: true,
    authMode: 'api-key',
    oauthProvider: 'anthropic',
    providerKey: 'openrouter',
    selectionKind: 'api-route',
    routeProvider: 'openrouter',
    routeModel: 'anthropic/claude-sonnet-4',
    preferredDirectProvider: 'openrouter',
    preferredDirectModel: 'anthropic/claude-sonnet-4',
    tierTag: 'account',
    fallbackChain: [
      { provider: 'openrouter', model: 'anthropic/claude-sonnet-4', label: 'OpenRouter Claude' },
      { provider: 'openrouter', model: 'openrouter/auto', label: 'OpenRouter auto' },
    ],
  },
  {
    id: 'account-anthropic:claude-opus-4-6',
    name: 'Claude Opus 4.6',
    contextLength: 200000,
    supportsTools: true,
    supportsVision: true,
    authMode: 'api-key',
    oauthProvider: 'anthropic',
    providerKey: 'openrouter',
    selectionKind: 'api-route',
    routeProvider: 'openrouter',
    routeModel: 'anthropic/claude-opus-4.1',
    preferredDirectProvider: 'openrouter',
    preferredDirectModel: 'anthropic/claude-opus-4.1',
    tierTag: 'account',
    fallbackChain: [
      { provider: 'openrouter', model: 'anthropic/claude-opus-4.1', label: 'OpenRouter Claude' },
      { provider: 'openrouter', model: 'openrouter/auto', label: 'OpenRouter auto' },
    ],
  },
  {
    id: 'account-anthropic:claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    contextLength: 200000,
    supportsTools: true,
    supportsVision: true,
    authMode: 'api-key',
    oauthProvider: 'anthropic',
    providerKey: 'openrouter',
    selectionKind: 'api-route',
    routeProvider: 'openrouter',
    routeModel: 'anthropic/claude-sonnet-4',
    preferredDirectProvider: 'openrouter',
    preferredDirectModel: 'anthropic/claude-sonnet-4',
    tierTag: 'account',
    fallbackChain: [
      { provider: 'openrouter', model: 'anthropic/claude-sonnet-4', label: 'OpenRouter Claude' },
      { provider: 'openrouter', model: 'openrouter/auto', label: 'OpenRouter auto' },
    ],
  },
]

const CHATGPT_PLUS_MODELS: ModelInfo[] = [
  {
    id: 'account-openai:gpt-5.4',
    name: 'GPT-5.4',
    contextLength: 200000,
    supportsTools: true,
    supportsVision: true,
    authMode: 'api-key',
    oauthProvider: 'openai',
    providerKey: 'openrouter',
    selectionKind: 'api-route',
    routeProvider: 'openrouter',
    routeModel: 'openrouter/auto',
    preferredDirectProvider: 'openrouter',
    preferredDirectModel: 'openrouter/auto',
    tierTag: 'account',
    fallbackChain: [
      { provider: 'openrouter', model: 'openrouter/auto', label: 'OpenRouter auto' },
      { provider: 'openrouter', model: 'openai/gpt-5-nano', label: 'OpenRouter OpenAI' },
    ],
  },
  {
    id: 'account-openai:gpt-5.4-mini',
    name: 'GPT-5.4 Mini',
    contextLength: 200000,
    supportsTools: true,
    supportsVision: true,
    authMode: 'api-key',
    oauthProvider: 'openai',
    providerKey: 'openrouter',
    selectionKind: 'api-route',
    routeProvider: 'openrouter',
    routeModel: 'openai/gpt-5-nano',
    preferredDirectProvider: 'openrouter',
    preferredDirectModel: 'openai/gpt-5-nano',
    tierTag: 'account',
    fallbackChain: [
      { provider: 'openrouter', model: 'openrouter/auto', label: 'OpenRouter auto' },
      { provider: 'openrouter', model: 'openai/gpt-5-nano', label: 'OpenRouter OpenAI' },
    ],
  },
  {
    id: 'account-openai:gpt-5.3-codex',
    name: 'GPT-5.3 Codex',
    contextLength: 200000,
    supportsTools: true,
    supportsVision: true,
    authMode: 'api-key',
    oauthProvider: 'openai',
    providerKey: 'openrouter',
    selectionKind: 'api-route',
    routeProvider: 'openrouter',
    routeModel: 'qwen/qwen3-coder',
    preferredDirectProvider: 'openrouter',
    preferredDirectModel: 'qwen/qwen3-coder',
    tierTag: 'account',
    fallbackChain: [
      { provider: 'openrouter', model: 'openrouter/auto', label: 'OpenRouter auto' },
      { provider: 'openrouter', model: 'qwen/qwen3-coder', label: 'OpenRouter Coder' },
    ],
  },
  {
    id: 'account-openai:gpt-5.2-codex',
    name: 'GPT-5.2 Codex',
    contextLength: 200000,
    supportsTools: true,
    supportsVision: true,
    authMode: 'api-key',
    oauthProvider: 'openai',
    providerKey: 'openrouter',
    selectionKind: 'api-route',
    routeProvider: 'openrouter',
    routeModel: 'qwen/qwen3-coder',
    preferredDirectProvider: 'openrouter',
    preferredDirectModel: 'qwen/qwen3-coder',
    tierTag: 'account',
    fallbackChain: [
      { provider: 'openrouter', model: 'openrouter/auto', label: 'OpenRouter auto' },
      { provider: 'openrouter', model: 'qwen/qwen3-coder', label: 'OpenRouter Coder' },
    ],
  },
  {
    id: 'account-openai:gpt-5.2',
    name: 'GPT-5.2',
    contextLength: 200000,
    supportsTools: true,
    supportsVision: true,
    authMode: 'api-key',
    oauthProvider: 'openai',
    providerKey: 'openrouter',
    selectionKind: 'api-route',
    routeProvider: 'openrouter',
    routeModel: 'openrouter/auto',
    preferredDirectProvider: 'openrouter',
    preferredDirectModel: 'openrouter/auto',
    tierTag: 'account',
    fallbackChain: [
      { provider: 'openrouter', model: 'openrouter/auto', label: 'OpenRouter auto' },
      { provider: 'openrouter', model: 'openai/gpt-5-nano', label: 'OpenRouter OpenAI' },
    ],
  },
  {
    id: 'account-openai:gpt-5.1-codex-max',
    name: 'GPT-5.1 Codex Max',
    contextLength: 200000,
    supportsTools: true,
    supportsVision: true,
    authMode: 'api-key',
    oauthProvider: 'openai',
    providerKey: 'openrouter',
    selectionKind: 'api-route',
    routeProvider: 'openrouter',
    routeModel: 'qwen/qwen3-coder',
    preferredDirectProvider: 'openrouter',
    preferredDirectModel: 'qwen/qwen3-coder',
    tierTag: 'account',
    fallbackChain: [
      { provider: 'openrouter', model: 'openrouter/auto', label: 'OpenRouter auto' },
      { provider: 'openrouter', model: 'qwen/qwen3-coder', label: 'OpenRouter Coder' },
    ],
  },
  {
    id: 'account-openai:gpt-5.1-codex-mini',
    name: 'GPT-5.1 Codex Mini',
    contextLength: 200000,
    supportsTools: true,
    supportsVision: true,
    authMode: 'api-key',
    oauthProvider: 'openai',
    providerKey: 'openrouter',
    selectionKind: 'api-route',
    routeProvider: 'openrouter',
    routeModel: 'qwen/qwen3-coder',
    preferredDirectProvider: 'openrouter',
    preferredDirectModel: 'qwen/qwen3-coder',
    tierTag: 'account',
    fallbackChain: [
      { provider: 'openrouter', model: 'openrouter/auto', label: 'OpenRouter auto' },
      { provider: 'openrouter', model: 'qwen/qwen3-coder', label: 'OpenRouter Coder' },
    ],
  },
]

const OPENROUTER_API_MODELS: ModelInfo[] = [
  {
    id: 'openrouter/auto',
    name: 'OpenRouter Auto',
    displayName: 'OpenRouter Auto',
    contextLength: 200000,
    supportsTools: true,
    supportsVision: true,
    authMode: 'api-key',
    providerKey: 'openrouter',
    selectionKind: 'api-route',
    routeProvider: 'openrouter',
    routeModel: 'openrouter/auto',
    preferredDirectProvider: 'openrouter',
    preferredDirectModel: 'openrouter/auto',
    tierTag: 'auto',
  },
]

function makeOpenRouterCuratedModel(
  id: string,
  name: string,
  contextLength: number,
  inputPricePerM: number,
  outputPricePerM: number,
  supportsTools: boolean,
  supportsVision: boolean,
  tierTag: 'paid' | 'tier',
): ModelInfo {
  return {
    id,
    name,
    displayName: name,
    contextLength,
    supportsTools,
    supportsVision,
    inputPricePerM,
    outputPricePerM,
    isFree: inputPricePerM === 0 && outputPricePerM === 0,
    authMode: 'api-key',
    providerKey: 'openrouter',
    selectionKind: 'api-route',
    routeProvider: 'openrouter',
    routeModel: id,
    preferredDirectProvider: 'openrouter',
    preferredDirectModel: id,
    tierTag,
  }
}

// Canon curado y congelado (backup + validación OpenRouter API 2026-04-04)
const OPENROUTER_PAID_CURATED: ModelInfo[] = [
  makeOpenRouterCuratedModel('google/gemini-3.1-flash-lite-preview', 'Gemini 3.1 Flash Lite', 1048576, 0.25, 1.5, true, true, 'paid'),
  makeOpenRouterCuratedModel('qwen/qwen3.5-397b-a17b', 'Qwen 3.5 397B', 262144, 0.39, 2.34, true, true, 'paid'),
  makeOpenRouterCuratedModel('z-ai/glm-5-turbo', 'GLM 5 Turbo', 202752, 1.2, 4, true, false, 'paid'),
  makeOpenRouterCuratedModel('xiaomi/mimo-v2-pro', 'MiMo V2 Pro', 1048576, 1, 3, true, false, 'paid'),
  makeOpenRouterCuratedModel('xiaomi/mimo-v2-omni', 'MiMo V2 Omni', 262144, 0.4, 2, true, true, 'paid'),
  makeOpenRouterCuratedModel('x-ai/grok-4.1-fast', 'Grok 4.1 Fast', 2000000, 0.2, 0.5, true, true, 'paid'),
  makeOpenRouterCuratedModel('x-ai/grok-code-fast-1', 'Grok Code Fast', 256000, 0.2, 1.5, true, false, 'paid'),
  makeOpenRouterCuratedModel('qwen/qwen3-max', 'Qwen 3 Max', 262144, 0.78, 3.9, true, false, 'paid'),
  makeOpenRouterCuratedModel('qwen/qwen3-coder', 'Qwen 3 Coder', 262144, 0.22, 1, true, false, 'paid'),
  makeOpenRouterCuratedModel('deepseek/deepseek-r1', 'DeepSeek R1 (OpenRouter)', 64000, 0.7, 2.5, true, false, 'paid'),
  makeOpenRouterCuratedModel('meta-llama/llama-3.3-70b-instruct', 'Llama 3.3 70B', 131072, 0.1, 0.32, true, false, 'paid'),
  makeOpenRouterCuratedModel('nvidia/nemotron-3-super-120b-a12b', 'Nemotron 3 Super 120B', 262144, 0.1, 0.5, true, false, 'paid'),
  makeOpenRouterCuratedModel('bytedance-seed/seed-1.6-flash', 'Seed 1.6 Flash', 262144, 0.075, 0.3, true, true, 'paid'),
  makeOpenRouterCuratedModel('openai/gpt-5-nano', 'GPT-5 Nano (OpenRouter)', 400000, 0.05, 0.4, true, true, 'paid'),
  makeOpenRouterCuratedModel('anthropic/claude-sonnet-4', 'Claude Sonnet 4 (OpenRouter)', 200000, 3, 15, true, true, 'paid'),
  makeOpenRouterCuratedModel('anthropic/claude-opus-4.1', 'Claude Opus 4.1 (OpenRouter)', 200000, 15, 75, true, true, 'paid'),
  makeOpenRouterCuratedModel('xiaomi/mimo-v2-flash', 'MiMo V2 Flash', 262144, 0.09, 0.29, true, false, 'paid'),
]

const OPENROUTER_TIER_CURATED: ModelInfo[] = [
  makeOpenRouterCuratedModel('cognitivecomputations/dolphin-mistral-24b-venice-edition:free', 'Dolphin Mistral 24B (Tier)', 32768, 0, 0, false, false, 'tier'),
  makeOpenRouterCuratedModel('google/gemma-3-27b-it:free', 'Gemma 3 27B (Tier)', 131072, 0, 0, false, true, 'tier'),
  makeOpenRouterCuratedModel('meta-llama/llama-3.3-70b-instruct:free', 'Llama 3.3 70B (Tier)', 65536, 0, 0, true, false, 'tier'),
  makeOpenRouterCuratedModel('nvidia/nemotron-3-super-120b-a12b:free', 'Nemotron 120B (Tier)', 262144, 0, 0, true, false, 'tier'),
  makeOpenRouterCuratedModel('qwen/qwen3-coder:free', 'Qwen 3 Coder (Tier)', 262000, 0, 0, true, false, 'tier'),
  makeOpenRouterCuratedModel('stepfun/step-3.5-flash:free', 'Step 3.5 Flash (Tier)', 256000, 0, 0, true, false, 'tier'),
  makeOpenRouterCuratedModel('minimax/minimax-m2.5:free', 'MiniMax M2.5 (Tier)', 196608, 0, 0, true, false, 'tier'),
  makeOpenRouterCuratedModel('openai/gpt-oss-120b:free', 'GPT OSS 120B (Tier)', 131072, 0, 0, true, false, 'tier'),
  makeOpenRouterCuratedModel('qwen/qwen3-next-80b-a3b-instruct:free', 'Qwen3 Next 80B (Tier)', 262144, 0, 0, true, false, 'tier'),
  makeOpenRouterCuratedModel('z-ai/glm-4.5-air:free', 'GLM 4.5 Air (Tier)', 131072, 0, 0, true, false, 'tier'),
  makeOpenRouterCuratedModel('qwen/qwen-turbo', 'Qwen Turbo', 131072, 0.0325, 0.13, true, false, 'tier'),
  makeOpenRouterCuratedModel('mistralai/mistral-small-3.1-24b-instruct', 'Mistral Small 3.1 24B', 131072, 0.03, 0.11, false, true, 'tier'),
  makeOpenRouterCuratedModel('meta-llama/llama-3.2-11b-vision-instruct', 'Llama 3.2 11B Vision', 131072, 0.049, 0.049, false, true, 'tier'),
  makeOpenRouterCuratedModel('openai/gpt-oss-120b', 'GPT OSS 120B', 131072, 0.039, 0.19, true, false, 'tier'),
  makeOpenRouterCuratedModel('qwen/qwen3.5-flash-02-23', 'Qwen 3.5 Flash', 1000000, 0.065, 0.26, true, true, 'tier'),
  makeOpenRouterCuratedModel('bytedance/ui-tars-1.5-7b', 'UI-TARS 1.5 7B', 128000, 0.1, 0.2, false, true, 'tier'),
  makeOpenRouterCuratedModel('qwen/qwen3-32b', 'Qwen 3 32B', 40960, 0.08, 0.24, true, false, 'tier'),
]

const OPENROUTER_MANUAL_MODELS: ModelInfo[] = [
  ...OPENROUTER_PAID_CURATED,
  ...OPENROUTER_TIER_CURATED,
]

const DEEPSEEK_DIRECT_MODELS: ModelInfo[] = [
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    contextLength: 128000,
    supportsTools: true,
    supportsVision: false,
    inputPricePerM: 0.27,
    outputPricePerM: 1.1,
    authMode: 'api-key',
    providerKey: 'deepseek',
    selectionKind: 'api-route',
    routeProvider: 'deepseek',
    routeModel: 'deepseek-chat',
    preferredDirectProvider: 'deepseek',
    preferredDirectModel: 'deepseek-chat',
    tierTag: 'deepseek',
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek Reasoner',
    contextLength: 128000,
    supportsTools: true,
    supportsVision: false,
    inputPricePerM: 0.55,
    outputPricePerM: 2.19,
    authMode: 'api-key',
    providerKey: 'deepseek',
    selectionKind: 'api-route',
    routeProvider: 'deepseek',
    routeModel: 'deepseek-reasoner',
    preferredDirectProvider: 'deepseek',
    preferredDirectModel: 'deepseek-reasoner',
    tierTag: 'deepseek',
  },
]


const GROQ_MODELS: ModelInfo[] = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq)', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true, providerKey: 'groq' },
  { id: 'llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout (Groq)', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true, providerKey: 'groq' },
  { id: 'kimi-k2-instruct', name: 'Kimi K2 Instruct (Groq)', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true, providerKey: 'groq' },
  { id: 'gpt-oss-120b', name: 'GPT OSS 120B (Groq)', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true, providerKey: 'groq' },
  { id: 'qwen3-32b', name: 'Qwen 3 32B (Groq)', contextLength: 131072, supportsTools: true, supportsVision: false, isFree: true, providerKey: 'groq' },
]

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'openrouter-pro',
    name: 'Cuentas Pro + OpenRouter',
    secretKey: 'openrouter',
    models: [...OPENROUTER_API_MODELS, ...OPENROUTER_MANUAL_MODELS, ...DEEPSEEK_DIRECT_MODELS, ...CLAUDE_PRO_MODELS, ...CHATGPT_PLUS_MODELS],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek directo',
    secretKey: 'deepseek',
    models: DEEPSEEK_DIRECT_MODELS,
  },
  {
    id: 'g4f-unlimited',
    name: 'G4F Ilimitado',
    secretKey: 'g4f',
    models: G4F_UNLIMITED_MODELS,
  },
  {
    id: 'groq',
    name: 'Groq (Tools Nativos)',
    secretKey: 'groq',
    models: GROQ_MODELS,
  },

]

// Backward-compat: G4F_PROVIDERS ya no necesario, pero exportamos vacio
export const G4F_PROVIDERS: G4FProviderInfo[] = []
export const FREE_MODELS: ModelInfo[] = []

export const MODEL_CATALOG = PROVIDERS

export function getProviderInfo(providerId: string): ProviderInfo | undefined {
  return PROVIDERS.find(p => p.id === providerId)
}

export function getModelInfo(providerId: string, modelId: string): ModelInfo | undefined {
  const provider = getProviderInfo(providerId)
  if (provider) {
    const match = provider.models.find(m => m.id === modelId)
    if (match) return match
  }

  for (const candidate of PROVIDERS) {
    const match = candidate.models.find(m => m.id === modelId)
    if (match) return match
  }

  return undefined
}

export function formatPrice(pricePerM: number | undefined): string {
  if (pricePerM == null || Number.isNaN(pricePerM)) return 'N/D'
  if (pricePerM === 0) return 'FREE'
  if (pricePerM < 0.01) return `$${pricePerM.toFixed(4)}/1M`
  if (pricePerM < 1) return `$${pricePerM.toFixed(3)}/1M`
  return `$${pricePerM.toFixed(2)}/1M`
}

export function formatModelLabel(model: ModelInfo): string {
  const input = formatPrice(model.inputPricePerM)
  const output = formatPrice(model.outputPricePerM)
  if (input === 'N/D' && output === 'N/D') return model.name
  return `${model.name}  -  in ${input} / out ${output}`
}

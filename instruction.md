# Groq API — Models & Rate Limits

## Available Models

### Text / Chat Models

| Model ID | Name | Owner | Context Window | Max Output | Features |
|---|---|---|---|---|---|
| `llama-3.3-70b-versatile` | Llama 3.3 70B | Meta | 131K | 32K | tools, json_mode |
| `llama-3.1-8b-instant` | Llama 3.1 8B | Meta | 131K | 131K | tools, json_mode |
| `meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B | Meta | 131K | 8K | tools, json_mode, vision |
| `qwen/qwen3-32b` | Qwen3-32B | Alibaba | 131K | 40K | tools, json_mode, reasoning |
| `qwen/qwen3.6-27b` | Qwen3.6-27B | Alibaba | 131K | 32K | tools, json_mode, reasoning, vision |
| `openai/gpt-oss-120b` | GPT OSS 120B | OpenAI | 131K | 65K | tools, json_mode, structured_outputs, reasoning |
| `openai/gpt-oss-20b` | GPT OSS 20B | OpenAI | 131K | 65K | tools, json_mode, structured_outputs, reasoning |
| `openai/gpt-oss-safeguard-20b` | Safety GPT OSS 20B | OpenAI | 131K | 65K | tools, json_mode, reasoning |
| `groq/compound` | Compound | Groq | 131K | 8K | json_mode |
| `groq/compound-mini` | Compound Mini | Groq | 131K | 8K | json_mode |
| `allam-2-7b` | ALLaM-2-7b | SDAIA | 4K | 4K | json_mode |

### Safety / Guard Models

| Model ID | Name | Context |
|---|---|---|
| `meta-llama/llama-prompt-guard-2-22m` | Llama Prompt Guard 2 22M | 512 |
| `meta-llama/llama-prompt-guard-2-86m` | Prompt Guard 2 86M | 512 |

### Audio Models

| Model ID | Name | Direction |
|---|---|---|
| `whisper-large-v3` | Whisper Large V3 | Speech → Text |
| `whisper-large-v3-turbo` | Whisper Large V3 Turbo | Speech → Text |
| `canopylabs/orpheus-v1-english` | Orpheus V1 English | Text → Speech |
| `canopylabs/orpheus-arabic-saudi` | Orpheus Arabic Saudi | Text → Speech |

---

## Rate Limits (Free / Dev Tier)

All limits are **per minute**.

| Model | Requests/min | Tokens/min |
|---|---|---|
| `llama-3.1-8b-instant` | 14,400 | 6,000 |
| `llama-3.3-70b-versatile` | 1,000 | 12,000 |
| `meta-llama/llama-4-scout-17b-16e-instruct` | 1,000 | 30,000 |
| `qwen/qwen3-32b` | 1,000 | 6,000 |

---

## Recommendations for Agentic Systems

| Role in Agent | Recommended Model | Reason |
|---|---|---|
| Orchestrator / Router | `llama-3.1-8b-instant` | Highest request limit (14.4K/min), fast |
| Main Reasoning / Planning | `llama-3.3-70b-versatile` | Strong reasoning, 12K TPM |
| Long-context Tool Output Processing | `meta-llama/llama-4-scout-17b-16e-instruct` | Best token budget (30K TPM), supports vision |
| Complex Multi-step Reasoning | `qwen/qwen3-32b` | Native reasoning support |
| Input Safety Filtering | `meta-llama/llama-prompt-guard-2-86m` | Lightweight prompt guard |

### Strategy
- Use `llama-3.1-8b-instant` for high-frequency steps (routing, tool-call parsing, short summaries) to preserve token budgets on larger models.
- Reserve `llama-4-scout-17b` or `llama-3.3-70b` for actual planning/reasoning steps.
- If your agent processes images, use `llama-4-scout-17b` or `qwen/qwen3.6-27b` (both support vision).
- For tool-use (function calling), all models marked `tools` in the features column are compatible.

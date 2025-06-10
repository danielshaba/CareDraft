# CareDraft AI Configuration Guide

## 🚀 Quick Setup with Your Fine-Tuned Models

### Step 1: Create Environment File

Create a `.env.local` file in the `caredraft/` directory with your OpenAI configuration:

```bash
# IMPORTANT: DO NOT commit this file to Git - it contains sensitive API keys

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your_openai_api_key_here

# Your Fine-Tuned Models
PRIMARY_OPENAI_MODEL=ft:gpt-4o-mini:personal::ftjob-GEQ7rH6zO5uHGenTo81wAm2I
FALLBACK_OPENAI_MODEL=ft:gpt-4o-mini:personal::ftjob-4cCrjAiMMhDNZgOAPr06Sr3w

# Backup standard models (in case fine-tuned models have issues)
BACKUP_PRIMARY_MODEL=gpt-4o-mini
BACKUP_FALLBACK_MODEL=gpt-3.5-turbo

# AI Configuration
AI_DEBUG_MODE=true
AI_LOG_REQUESTS=true
AI_MAX_RETRIES=3
AI_TIMEOUT_MS=45000

# Other required environment variables (update with your actual values)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_using_openssl_rand_base64_32
```

### Step 2: Verify Configuration

The app will automatically detect and use your fine-tuned models. You can verify the setup by checking the console logs when AI features are used.

## 🤖 AI Features Available

### 1. **Brainstorming Module** (`/api/ai/brainstorm`)
- **Purpose**: Generate creative ideas for tender responses
- **Uses**: Primary model (your GPT-4.1 mini fine-tuned)
- **Types**: ideas, responses, solutions, improvements

### 2. **Content Extraction** (`/api/ai/extract`)
- **Purpose**: Extract key information from tender documents
- **Uses**: Fallback model (your GPT-4.1 nano fine-tuned)

### 3. **Content Rewriting** (`/api/ai/rewrite`)
- **Purpose**: Improve and rewrite tender response content
- **Uses**: Primary model for quality output

### 4. **Document Summarization** (`/api/ai/summarize`)
- **Purpose**: Summarize long documents and requirements
- **Uses**: Fallback model for efficiency

### 5. **Strategy Generation** (`/api/ai/strategy-generation`)
- **Purpose**: Generate strategic approaches for tender responses
- **Uses**: Primary model for complex strategic thinking

### 6. **Fact Checking** (`/api/ai/fact-check`)
- **Purpose**: Verify claims and check compliance
- **Uses**: Primary model for accuracy

### 7. **Context Actions** (`/api/ai/context-actions`)
- **Purpose**: Various context-aware AI actions
- **Uses**: Model selection based on complexity

### 8. **RAG (Retrieval-Augmented Generation)** (`/api/rag`)
- **Purpose**: AI-powered knowledge base queries
- **Uses**: Integration with vector search and AI models

## 🔧 Model Selection Strategy

The system uses an intelligent fallback hierarchy:

1. **Complex Tasks** (brainstorming, strategy):
   - Primary: Your fine-tuned GPT-4.1 mini
   - Fallback: Your fine-tuned GPT-4.1 nano
   - Backup: Standard GPT-4o-mini
   - Final: GPT-3.5-turbo

2. **Simple Tasks** (extraction, summarization):
   - Primary: Your fine-tuned GPT-4.1 nano
   - Fallback: Your fine-tuned GPT-4.1 mini
   - Backup: Standard GPT-3.5-turbo
   - Final: GPT-4o-mini

## 🎯 Fine-Tuned Model Benefits

Your fine-tuned models are specifically optimized for:
- **Care sector terminology and context**
- **UK public procurement language**
- **Tender response best practices**
- **Compliance and regulatory awareness**
- **Professional tone and structure**

## 📊 Monitoring & Debugging

Enable debugging to monitor AI performance:

```bash
AI_DEBUG_MODE=true
AI_LOG_REQUESTS=true
```

This will show:
- Which model is being used for each request
- Token usage and costs
- Fallback attempts
- Performance metrics

## 🚨 Security Notes

1. **Never commit `.env.local`** - it contains your API key
2. **API Key Protection**: Your API key is only used server-side
3. **Model Access**: Fine-tuned models are private to your OpenAI account
4. **Rate Limiting**: Automatic retry with exponential backoff

## 🔍 Testing AI Features

### Test Brainstorming:
```bash
curl -X POST http://localhost:3000/api/ai/brainstorm \
  -H "Content-Type: application/json" \
  -d '{
    "context": "Improving elderly care services in residential homes",
    "type": "ideas",
    "maxSuggestions": 5
  }'
```

### Test Extraction:
```bash
curl -X POST http://localhost:3000/api/ai/extract \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Tender document text here...",
    "extractionType": "requirements"
  }'
```

## 🎚️ Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `PRIMARY_OPENAI_MODEL` | Model for complex tasks | `gpt-4o-mini` |
| `FALLBACK_OPENAI_MODEL` | Model for simple tasks | `gpt-3.5-turbo` |
| `BACKUP_PRIMARY_MODEL` | Backup for primary | `gpt-4o-mini` |
| `BACKUP_FALLBACK_MODEL` | Backup for fallback | `gpt-3.5-turbo` |
| `AI_DEBUG_MODE` | Enable debug logging | `false` |
| `AI_LOG_REQUESTS` | Log all AI requests | `false` |
| `AI_MAX_RETRIES` | Max retry attempts | `2` |
| `AI_TIMEOUT_MS` | Request timeout | `30000` |

## 🔄 Model Management

### Check Model Status:
The app automatically detects fine-tuned models and displays them in logs as:
- `CareDraft Fine-tuned GPT-4.1 Mini`
- `CareDraft Fine-tuned GPT-4.1 Nano`

### Fallback Behavior:
If fine-tuned models fail, the system automatically falls back to standard models ensuring your app continues working.

## 📈 Performance Optimization

1. **Model Selection**: Use nano model for simple tasks, mini for complex
2. **Caching**: Implement response caching for repeated queries
3. **Batching**: Combine multiple requests where possible
4. **Monitoring**: Track token usage and costs

## 🆘 Troubleshooting

### Model Not Found Error:
- Verify model IDs in OpenAI dashboard
- Check API key permissions
- Ensure models are accessible

### Rate Limiting:
- Increase `AI_MAX_RETRIES`
- Implement request queuing
- Use multiple API keys if needed

### Performance Issues:
- Enable `AI_DEBUG_MODE` to identify bottlenecks
- Optimize prompt length
- Use appropriate model for task complexity

## 📚 Next Steps

1. **Monitor Usage**: Check OpenAI usage dashboard
2. **Fine-Tune Further**: Collect user feedback for model improvements
3. **Optimize Prompts**: Refine system prompts for better results
4. **Scale**: Consider load balancing for high traffic 
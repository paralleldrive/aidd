# AI Crawler Audit Guide

Comprehensive reference for auditing AI crawler access to your website. Every
blocked AI bot is lost visibility in AI-generated answers and recommendations.

## 7 AI Crawlers

### Full User-Agent Strings

| Bot | User-Agent String | Platform |
|-----|------------------|----------|
| GPTBot | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0; +https://openai.com/gptbot)` | ChatGPT training + search |
| ChatGPT-User | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ChatGPT-User/1.0; +https://openai.com/bot)` | ChatGPT live browsing |
| ClaudeBot | `ClaudeBot/1.0 (https://www.anthropic.com)` | Claude training data |
| PerplexityBot | `PerplexityBot` | Perplexity AI search |
| Google-Extended | `Google-Extended` | Gemini AI features |
| Googlebot | `Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)` | Google Search + AI Overviews |
| Bingbot | `Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)` | Bing Search + Copilot |

## robots.txt Rules

### Status Classification

| Status | Meaning | Action |
|--------|---------|--------|
| `allowed` | Explicitly or implicitly allowed | 🟢 No action |
| `not_mentioned` | No rule for this bot | 🟡 Allowed by default, but add explicit Allow |
| `blocked` | `Disallow: /` for this User-Agent | 🔴 Remove block |
| `blocked_by_wildcard` | `User-agent: *` with `Disallow: /` | 🔴 Add explicit Allow for AI bots |

### Example: Recommended robots.txt

```
User-agent: *
Allow: /

# AI Crawlers — explicitly allowed
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

# Block sensitive paths only
User-agent: *
Disallow: /admin/
Disallow: /api/
Disallow: /private/

Sitemap: https://example.com/sitemap.xml
```

### Parsing Rules

1. **Specific beats general**: `User-agent: GPTBot` rules override `User-agent: *`
2. **Longest match wins**: `/public/docs` overrides `/public`
3. **Wildcards**: `Disallow: /*.pdf$` blocks PDF files
4. **Case-sensitive**: User-agent matching IS case-sensitive
5. **Empty Disallow**: `Disallow:` (empty) = allow everything
6. **No robots.txt**: No file = everything allowed (but add one explicitly)

## WAF & Cloudflare Challenge Detection

AI bots can be blocked at the WAF level even when robots.txt allows them.

### Challenge Patterns to Detect

| Pattern | Indicator |
|---------|-----------|
| `"Attention Required"` in HTML | Cloudflare block page |
| `"Just a moment"` in HTML | Cloudflare challenge page |
| `"Checking your browser"` in HTML | Generic bot challenge |
| HTTP 403 response | Access denied |
| HTTP 429 response | Rate limited |
| HTTP 503 + challenge page | Service-level bot detection |
| Response < 1KB for known-content page | Content stripped by WAF |

### Detection Method

For each AI bot User-Agent:

```
1. Fetch URL with bot's User-Agent string
2. Fetch URL with standard browser User-Agent (baseline)
3. Compare:
   - HTTP status codes (should match)
   - Response size (bot response should be > 50% of baseline)
   - Check for challenge patterns in bot response
   - Check for redirects to challenge pages
```

### Content Mismatch Detection

JavaScript-heavy sites may serve different content to bots:

```
Mismatch if:
  bot_html_length < (baseline_html_length * 0.5)
  OR key elements missing (H1, main content, schema)
  OR bot response contains only shell HTML + JS bundles
```

This affects AI visibility because bots see empty/minimal content.

## Platform-Specific Optimization

### ChatGPT (GPTBot + ChatGPT-User)
- Allow both User-Agents (GPTBot for training, ChatGPT-User for live browse)
- Structured FAQ content is frequently cited in ChatGPT responses
- JSON-LD schema increases extraction accuracy
- ChatGPT Browse uses live fetching — page speed matters

### Perplexity (PerplexityBot)
- Primary citation-based AI search engine
- Values structured, factual content with data points
- FAQ sections and comparison tables are frequently cited
- Freshness signals (updated dates) increase citation preference

### Google AI Overviews (Googlebot + Google-Extended)
- Googlebot access is essential for all search visibility
- Google-Extended controls Gemini AI feature access specifically
- Standard SEO best practices apply plus schema markup
- AI Overviews favor comprehensive, well-structured content

### Claude (ClaudeBot)
- Training data crawler for Anthropic's Claude models
- Respects robots.txt strictly
- Broad content access improves model knowledge of your brand

### Bing Copilot (Bingbot)
- Bingbot powers both Bing Search and Microsoft Copilot
- OpenGraph and meta descriptions are used in Copilot summaries
- Bing Webmaster Tools verification improves crawl efficiency

## Remediation by Scenario

### Scenario 1: Bot Blocked in robots.txt

**Fix**: Add explicit Allow rule

```
User-agent: {blocked_bot}
Allow: /
```

### Scenario 2: Blocked by Wildcard

**Fix**: Add specific User-Agent rules BEFORE the wildcard block

```
# Allow AI bots explicitly
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

# General rule
User-agent: *
Disallow: /admin/
```

### Scenario 3: WAF/Cloudflare Blocking

**Fix options** (platform-dependent):
1. Cloudflare: Dashboard → Security → Bots → Add verified bot exceptions
2. AWS WAF: Create rule to allow known AI bot User-Agents
3. Custom WAF: Whitelist AI bot IP ranges + User-Agent strings

### Scenario 4: JS Rendering Mismatch

**Fix**: Ensure critical content is in initial HTML, not JS-only:
1. Use server-side rendering (SSR) or static site generation (SSG)
2. Place H1, meta tags, and JSON-LD in the initial HTML response
3. Ensure main content text is present before JavaScript executes
4. Test with `curl` (raw HTML) vs browser (rendered) — content should match

### Scenario 5: Content Behind Login/Paywall

**Fix**: Implement `article` meta tags or Google's flexible sampling:
1. Make at least the first 2-3 paragraphs freely accessible
2. Use `<meta name="robots" content="max-snippet:300">` for preview length
3. Ensure JSON-LD schema is always in the public HTML
4. Consider a metered paywall (X free articles) instead of hard gate

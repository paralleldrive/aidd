# SEO Audit Checklist

Complete technical SEO checklist for traditional search and AI answer engine
optimization. Use alongside SKILL.md for the full audit process.

## Page Speed & Performance

| # | Check | Target | Priority |
|---|-------|--------|----------|
| 1 | LCP (Largest Contentful Paint) | < 2.5s | P0 |
| 2 | CLS (Cumulative Layout Shift) | < 0.1 | P0 |
| 3 | INP (Interaction to Next Paint) | < 200ms | P0 |
| 4 | TTFB (Time to First Byte) | < 800ms | P1 |
| 5 | Total page load time | < 2s | P0 |
| 6 | Image optimization | WebP/AVIF, lazy loading | P1 |
| 7 | Compression | gzip or brotli enabled | P1 |
| 8 | Render-blocking resources | Deferred or async JS/CSS | P1 |
| 9 | Browser caching | Cache-Control headers set | P2 |

## Content Structure

| # | Check | Target | Priority |
|---|-------|--------|----------|
| 10 | H1 tag | Exactly 1, contains primary keyword | P0 |
| 11 | H2 tags | ≥ 3, descriptive, keyword-relevant | P1 |
| 12 | Heading hierarchy | No skipped levels (H1→H2→H3) | P1 |
| 13 | Question headings | ≥ 1 H2/H3 in question format (for AEO) | P2 |
| 14 | Word count (pillar) | ≥ 1,500 words | P1 |
| 15 | Word count (support) | ≥ 800 words | P1 |
| 16 | Thin content | No pages < 300 words | P0 |
| 17 | Paragraph length | 2–4 sentences | P2 |

## Meta Tags

| # | Check | Target | Priority |
|---|-------|--------|----------|
| 18 | Title tag | 50–60 chars, primary keyword, unique | P0 |
| 19 | Meta description | 150–160 chars, CTA, unique | P0 |
| 20 | Canonical URL | Present, correct | P0 |
| 21 | Viewport meta | `width=device-width, initial-scale=1` | P0 |
| 22 | Robots meta | No unintentional noindex/nofollow | P0 |
| 23 | Open Graph tags | og:title, og:description, og:image, og:url | P1 |
| 24 | Twitter Card tags | twitter:card, twitter:title, twitter:description | P2 |
| 25 | Hreflang | Present if multilingual | P1 |

## Schema Markup (JSON-LD)

| # | Check | Target | Priority |
|---|-------|--------|----------|
| 26 | JSON-LD present | At least 1 schema type per page | P0 |
| 27 | Valid JSON | No syntax errors | P0 |
| 28 | @context | `https://schema.org` | P0 |
| 29 | Organization | On homepage: name, url, logo, sameAs | P1 |
| 30 | Article | On blog posts: headline, author, dates | P1 |
| 31 | FAQPage | On FAQ sections: mainEntity array | P1 |
| 32 | BreadcrumbList | On all pages: itemListElement | P2 |
| 33 | Product | On product pages: name, offers, rating | P1 |
| 34 | HowTo | On tutorials: step array | P2 |

## AI Crawler Access

| # | Check | Target | Priority |
|---|-------|--------|----------|
| 35 | GPTBot | Allowed in robots.txt | P0 |
| 36 | ChatGPT-User | Allowed in robots.txt | P0 |
| 37 | ClaudeBot | Allowed in robots.txt | P0 |
| 38 | PerplexityBot | Allowed in robots.txt | P1 |
| 39 | Google-Extended | Allowed in robots.txt | P1 |
| 40 | Googlebot | Allowed in robots.txt | P0 |
| 41 | Bingbot | Allowed in robots.txt | P0 |
| 42 | No WAF/Cloudflare blocks | Bots not challenged | P0 |
| 43 | JS rendering parity | Raw HTML ≈ rendered HTML | P1 |

## Content Quality

### AI Phrase Detection (35 Patterns)

Flag content that overuses generic AI-generated phrases. Threshold: > 3 per 1,000 words = fail.

```
"when it comes to"
"leverage"
"utilize"
"synergy"
"holistic"
"robust"
"seamless"
"game-changer"
"unlock the power"
"take to the next level"
"paradigm"
"facilitate"
"meticulous"
"navigate the complexities"
"it's important to note"
"in today's digital landscape"
"elevate your"
"cutting-edge"
"best-in-class"
"deep dive"
"at the end of the day"
"move the needle"
"low-hanging fruit"
"circle back"
"thought leader"
"innovative solution"
"streamline"
"empower"
"actionable insights"
"ecosystem"
"scalable"
"world-class"
"state-of-the-art"
"next-generation"
"transformative"
```

### Readability Targets

| Metric | Target | Audience |
|--------|--------|----------|
| Flesch Reading Ease | ≥ 60 | General audience |
| Grade level | ≤ 12 | Non-academic |
| Avg sentence length | < 20 words | Readable |
| Complex word ratio | < 15% | Accessible |
| Passive voice | < 25% | Active writing |
| Transition words | ≥ 2 per section | Connected flow |
| Sentence length variance | stdev ≥ 3.0 | Natural rhythm |

### Specificity Indicators

Content scores higher when it contains:
- Specific percentages: "increased conversion by 23%"
- Dollar amounts: "saved $50,000 annually"
- Named tools/companies: "integrates with Salesforce"
- Time-specific data: "as of Q1 2024"
- Methodology references: "using the RICE framework"

Penalize vague qualifiers: "very", "really", "quite", "somewhat", "basically",
"actually", "literally", "just"

## Trust Signals

### Testimonials (35 pts max)
- Quoted text 20–300 characters with attribution
- Specific results: percentages, dollar amounts, time metrics
- Named person with title/company

### Social Proof (30 pts max)
- Customer counts: "trusted by 10,000+ companies"
- Specific results: "grew revenue 45%", "increased leads 3x"
- Time results: "saves 4 hours per week"
- Logo bars with recognized brands

### Risk Reversals (25 pts max)
Keywords to detect:
```
"free trial", "no credit card", "cancel anytime",
"money-back guarantee", "full refund", "risk-free",
"no obligation", "satisfaction guarantee", "try free",
"no commitment"
```

### Authority Signals (10 pts max)
- Media mentions: "as seen in Forbes, TechCrunch"
- Awards and certifications
- Partnership badges
- Years in business: "since 2015", "10+ years"
- "trusted by", "industry leader", "award-winning"

### Security Signals
- Privacy policy link
- Compliance badges: GDPR, SOC 2, HIPAA, PCI-DSS
- "data protection", "encryption", "secure checkout"

## Engagement Criteria

### Hook Quality (opening paragraph)
- Addresses a specific pain point
- Contains a question or surprising stat
- Length: 2–3 sentences max

### CTA Distribution
- At least 1 CTA per 500 words
- Final CTA in last section
- CTAs use action verbs: "get started", "try free", "learn more"

### Sentence Rhythm
- Mix of short (≤ 10 words), medium, and long (> 20 words) sentences
- No more than 3 consecutive long sentences
- Short sentences for emphasis after complex ideas

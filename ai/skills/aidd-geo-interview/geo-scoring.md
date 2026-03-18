# GEO Scoring Methodology

Reference document for the GEO interview skill's scoring, sentiment analysis,
and citation readiness assessment.

## 7-Dimension GEO Score

Overall GEO visibility score (0–100) composed of weighted dimensions:

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| Citation Readiness | 25% | Structured content that AI models can cite (FAQ, tables, stats, schema) |
| Technical Infrastructure | 15% | Page speed, mobile-friendliness, crawlability, AI bot access |
| Schema Coverage | 15% | JSON-LD structured data (Organization, FAQPage, HowTo, Article, Product) |
| SEO Fundamentals | 15% | Title tags, meta descriptions, headers, canonical URLs, internal linking |
| Content Quality | 15% | Depth, specificity, readability, E-E-A-T signals, freshness |
| Social Proof | 5% | Reviews, testimonials, awards, media mentions, trust signals |
| Fan-Out Coverage | 10% | How many fan-out query types the site's content addresses |

## Share of Voice Calculation

```
SoV = (mention_count / total_queries) * 10
```

| SoV Score | Rating | Interpretation |
|-----------|--------|---------------|
| 8–10 | Excellent | Dominant presence, regularly recommended |
| 6–7 | Good | Solid visibility, mentioned in most contexts |
| 4–5 | Moderate | Inconsistent presence, room to grow |
| 2–3 | Poor | Rarely mentioned, significant gaps |
| 0–1 | Critical | Invisible to AI models |

## Replaceability Score

How easily an AI could replace a page's answer with a different source (1–10, lower = better):

**Scoring signals** (each reduces replaceability by 1–2 points):
- Contains specific numbers, percentages, or data points
- Includes tables or structured comparisons
- References named frameworks or proprietary methodologies
- Has clear author attribution with credentials
- Provides a TL;DR or executive summary
- Contains original research or first-party data
- Includes timestamps or freshness indicators

**Replaceability thresholds**:
- 1–3: Hard to replace — unique data, proprietary insights
- 4–6: Moderate — good content but could be sourced elsewhere
- 7–10: Easily replaced — generic advice available anywhere

## Citation Signals Checklist

Content elements that make AI models more likely to cite a source:

| Signal | Why It Works |
|--------|-------------|
| ✅ Data tables with specific numbers | AI models prefer citing concrete data |
| ✅ FAQ sections with clear Q&A pairs | Direct question-answer format matches query patterns |
| ✅ Numbered/percentage statistics | Specific claims are more citable than generalizations |
| ✅ Author byline with credentials | E-E-A-T signals increase citation trustworthiness |
| ✅ TL;DR or summary section | Provides extractable snippet for AI responses |
| ✅ Step-by-step instructions | Procedural content is cited for how-to queries |
| ✅ Comparison tables | Side-by-side data is cited for comparison queries |
| ✅ Published/updated dates | Freshness signals increase citation preference |
| ✅ Schema markup (JSON-LD) | Machine-readable metadata aids AI extraction |
| ✅ Blockquote testimonials | Social proof that AI models can reference |

## Sentiment Signal Words

### Positive Signals
Words indicating favorable AI perception:

```
excellent, great, best, recommend, top, leading, popular,
powerful, impressive, solid, strong, well-known, highly rated,
standout, favorite, reliable, innovative, trusted, preferred,
comprehensive, versatile, efficient
```

### Negative Signals
Words indicating unfavorable AI perception:

```
poor, worst, avoid, lacking, weak, limited, outdated,
expensive, disappointing, behind, issues, problems, concern,
drawback, difficult, complex, unreliable, frustrating,
cumbersome, overpriced
```

### Sentiment Scoring

```
For each AI response mentioning the product:
  positive_count = count of positive signal words in context
  negative_count = count of negative signal words in context

  sentiment = positive if positive_count > negative_count
  sentiment = negative if negative_count > positive_count
  sentiment = neutral otherwise
```

## Advanced GEO Tactics

Content strategies that increase AI citation likelihood:

| Tactic | Description |
|--------|-------------|
| Stat-bait tables | Tables with specific metrics that AI models cite directly |
| Information gap targeting | Content addressing questions competitors don't answer |
| Agent-directed schema | JSON-LD specifically designed for AI extraction |
| Comparison positioning | "X vs Y" content where your product wins objectively |
| Authority stacking | Multiple trust signals on a single page (author + data + testimonials) |
| Freshness signals | Regular updates with visible timestamps |

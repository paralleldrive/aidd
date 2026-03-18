# Fan-Out Query Templates

Extended query templates for comprehensive GEO visibility analysis. Use these to
expand beyond the 7 core queries in SKILL.md for deeper coverage assessment.

## Query Categories

### 1. best_of (Weight: 9/10)

High-value discovery queries — these are how users find new products.

```
"best {category} for {audience}"
"best {category} {year}"
"top {category}"
"best {category} near me"
"best {category} for startups"
"best {category} for enterprise"
```

### 2. comparison (Weight: 9/10)

Direct head-to-head queries — high commercial intent.

```
"{product} vs {competitor}"
"{competitor} vs {product}"
"{product} compared to {competitor}"
"{product} or {competitor}"
```

### 3. alternative (Weight: 8/10)

Competitor displacement queries — users actively seeking switches.

```
"{competitor} alternatives"
"{competitor} alternatives {year}"
"places like {competitor}"
"{product} alternatives"
```

### 4. problem (Weight: 8/10)

Pain-point queries — users looking for solutions, not brands.

```
"{pain_point}"
"why is {pain_point}"
"how to fix {pain_point}"
"solve {pain_point}"
```

### 5. how_to (Weight: 7/10)

Informational queries that build topical authority.

```
"how to choose a {category}"
"how to use {product}"
"how to {solve_problem}"
```

### 6. pricing (Weight: 7/10)

Commercial queries — strong purchase intent signals.

```
"{product} pricing"
"{product} pricing {year}"
"{product} cost breakdown"
"how much does {product} cost"
```

### 7. what_is (Weight: 6/10)

Awareness queries — these drive top-of-funnel visibility.

```
"what is {product}"
"{product} review"
"{product} review {year}"
"{product} features"
```

### 8. when_to (Weight: 5/10)

Decision-timing queries.

```
"is {product} worth it"
"when to use {product}"
"{product} use cases"
```

### 9. integration (Weight: 4/10)

Ecosystem queries — lower volume but high conversion.

```
"{product} integrations"
"{product} API"
"{product} with {other_tool}"
```

## Type Weight Scoring

Use weights to prioritize which query types to target first:

| Type | Weight | Rationale |
|------|--------|-----------|
| best_of | 9 | Highest discovery volume, drives recommendations |
| comparison | 9 | High commercial intent, direct conversion |
| alternative | 8 | Active switchers, displacement opportunity |
| problem | 8 | Solution-seekers, builds authority |
| how_to | 7 | Topical authority, informational trust |
| pricing | 7 | Purchase intent, commercial queries |
| what_is | 6 | Awareness building, top-of-funnel |
| when_to | 5 | Decision support, moderate volume |
| integration | 4 | Ecosystem fit, lower volume |

## Query Scoring Dimensions

Each generated query can be scored on 4 dimensions:

| Dimension | Description | Scale |
|-----------|-------------|-------|
| volume_signal | Estimated search demand for this query pattern | 0–10 |
| citation_opportunity | How likely AI models include citations in answers | 0–10 |
| current_gap | How poorly the product currently covers this query | 0–10 |
| commercial_intent | How close to purchase decision this query sits | 0–10 |

**Composite score**: `(volume * 0.3) + (citation_opp * 0.3) + (gap * 0.25) + (commercial * 0.15)`

## Industry-Specific Adjustments

- **B2B SaaS**: Emphasize comparison, integration, and pricing queries
- **E-commerce**: Emphasize best_of, pricing, and alternative queries
- **Local business**: Emphasize best_of ("near me"), problem, and what_is queries
- **Content/Media**: Emphasize how_to, what_is, and problem queries

Exclude query types that don't apply to the product's industry (e.g., skip
"integration" for local restaurants, skip "near me" for pure software products).

# Recursive Language Models: Paper Findings

**Paper**: Recursive Language Models
**Authors**: Alex L. Zhang, Tim Kraska, Omar Khattab (MIT CSAIL)
**Published**: December 31, 2025
**arXiv**: 2512.24601
**Source**: https://arxiv.org/abs/2512.24601

## Abstract

The paper addresses **context rot** - the phenomenon where even frontier models like GPT-5 degrade quickly as context gets longer. RLMs propose a general inference strategy that treats long prompts as part of an external environment, allowing the LLM to programmatically examine, decompose, and recursively call itself over snippets of the prompt.

## Core Problem: Context Rot

**Challenge**: LLM quality degrades dramatically with long context
- Even state-of-the-art models struggle beyond certain context lengths
- Simply extending context windows doesn't solve quality degradation
- Need: Dramatically scale context size by orders of magnitude

**Question**: Can we scale general-purpose LLM context beyond model limits?

## Solution: Recursive Language Models

### Key Innovation

Instead of stuffing everything into the context window:
1. **Load input as a variable** in a programming environment (REPL)
2. **Programmatically examine** the input through code
3. **Decompose** complex queries into simpler sub-queries
4. **Recursively invoke** the LLM over smaller snippets
5. **Aggregate results** back through the call stack

### Architecture

**Traditional LLM Call**:
```python
response = llm.completion(prompt, model)
```

**RLM Call**:
```python
# Prompt becomes a variable in REPL
response = rlm.completion(prompt, model)
# Model can now:
# - peek into prompt programmatically
# - decompose it into parts
# - recursively call itself over snippets
# - aggregate results
```

### REPL Environment

RLMs use a Python REPL sandbox where:
- Long input is loaded as a variable (not in context)
- Model writes code to examine the variable
- Model launches sub-calls through code
- Results accumulate in the REPL state
- Final answer synthesized from sub-results

## Performance Results

**Context Scaling**:
- Handles inputs **2 orders of magnitude** beyond model context windows
- Successfully processes 100x longer contexts than base models

**Quality Improvements**:
- Dramatically outperforms base LLM quality on long-context tasks
- Tested across 4 diverse long-context benchmarks
- Maintains quality at extreme context lengths

## Recursive Decomposition Strategy

### Pattern Recognition

Model learns to:
1. **Identify complexity** - "Is this query too complex for one call?"
2. **Decompose hierarchically** - Break into logical sub-problems
3. **Plan execution** - Determine order and dependencies
4. **Execute recursively** - Launch sub-calls in REPL
5. **Aggregate intelligently** - Combine results into coherent answer

### Example Flow

**Query**: "Summarize all authentication flows in this codebase"

**RLM Decomposition**:
```python
# Step 1: Load codebase as variable
codebase = load_input(prompt)

# Step 2: Find relevant files
auth_files = code.execute("find files matching 'auth'")

# Step 3: Recursively process each file
summaries = []
for file in auth_files:
    summary = rlm.completion(f"Summarize auth flow in {file}")
    summaries.append(summary)

# Step 4: Aggregate
final_summary = rlm.completion(f"Synthesize these summaries: {summaries}")

return final_summary
```

## Implementation Details

### Sandboxing Options

**Non-Isolated**:
- LocalREPL: Same process, shared virtual environment
- Fast but less secure
- Good for development and trusted inputs

**Isolated**:
- DockerREPL: Containerized execution
- Modal: Cloud sandboxes
- Prime Sandboxes: Beta cloud option
- Secure but slower

### Logging and Debugging

**RLMLogger**:
- Records full trajectory of recursive calls
- Visualizes call tree
- Shows code execution, sub-LM calls, root-LM calls
- Essential for debugging complex decompositions

### Backend Support

Works with multiple LLM backends:
- OpenAI (GPT models)
- Anthropic (Claude)
- OpenRouter
- Portkey
- LiteLLM
- Local models

## Key Insights for aidd

### 1. External Environment Pattern

**RLM Concept**: Treat long context as external environment
**aidd Translation**: Codebase is external environment

Instead of reading entire codebase into context:
- Index codebase metadata in SQLite
- Query programmatically
- Recursively explore relevant areas
- Aggregate findings

### 2. Programmatic Examination

**RLM Concept**: Write code to peek into input variable
**aidd Translation**: Query tools examine codebase

RLM uses Python REPL, aidd uses:
- Grep/Glob for search
- SQLite for structured queries
- Read for snippet examination
- Bash for symbolic execution

### 3. Recursive Decomposition

**RLM Concept**: Break complex queries into sub-queries
**aidd Translation**: Hierarchical codebase exploration

Example:
- "Find auth flow" →
  - "Find auth files"
  - "Trace dependencies"
  - "Extract logic"
  - "Synthesize flow"

### 4. Result Aggregation

**RLM Concept**: Combine sub-results into final answer
**aidd Translation**: Semantic summarization of findings

Use AI for:
- Synthesizing search results
- Identifying patterns
- Drawing conclusions
- Generating explanations

## Application to Code Understanding

### Why RLMs Excel at Code

**Code characteristics**:
- Highly structured
- Hierarchical organization
- Clear boundaries (files, functions, modules)
- Explicit dependencies
- Searchable patterns

**RLM advantages**:
- Natural decomposition by file/module
- Programmatic traversal of imports
- Recursive exploration of call chains
- Aggregation of module summaries

### Strategies for Codebase Exploration

**1. Top-Down Exploration**:
```
Query: "How does authentication work?"
→ Find auth-related files
→ For each file, extract key functions
→ For each function, trace dependencies
→ Synthesize into flow diagram
```

**2. Bottom-Up Search**:
```
Query: "Where is password hashing used?"
→ Search for hash/bcrypt/crypto
→ Identify usage locations
→ Trace upward to calling functions
→ Build usage map
```

**3. Dependency Traversal**:
```
Query: "What depends on database module?"
→ Find all imports of database
→ For each importer, find its importers
→ Build dependency tree
→ Identify high-impact modules
```

## Implementation Recommendations

### For aidd RLM Skill

**1. Build Query Infrastructure**:
- SQLite indexing for fast lookups
- FTS5 for full-text search
- Dependency graph storage

**2. Implement Decomposition Functions**:
- Define common exploration patterns
- Create SudoLang functions for recursive logic
- Build CLI tools for symbolic queries

**3. Enable Agent Intelligence**:
- Agent decides when to use RLM
- Agent plans decomposition strategy
- Agent synthesizes results

**4. Provide Clear Guidelines**:
- Document when to use RLM vs simple search
- Show example decompositions
- Explain performance trade-offs

## Performance Considerations

**When to Use RLMs**:
- ✅ Complex queries spanning multiple files
- ✅ Deep dependency traversal
- ✅ Pattern finding across large codebase
- ✅ Architectural understanding

**When NOT to Use**:
- ❌ Simple file content questions
- ❌ Single-location lookups
- ❌ Already have small relevant context

**Trade-offs**:
- More API calls (cost)
- Longer total execution time
- Better final quality
- Handles unlimited context

## References

### Primary Sources
- Paper: https://arxiv.org/abs/2512.24601
- Implementation: https://github.com/alexzhang13/rlm
- Blog post: https://alexzhang13.github.io/blog/2025/rlm/

### Analysis
- Prime Intellect: https://www.primeintellect.ai/blog/rlm
- MarkTechPost: https://www.marktechpost.com/2026/01/02/recursive-language-models-rlms-from-mits-blueprint-to-prime-intellects-rlmenv-for-long-horizon-llm-agents/

### Related Work
- HuggingFace: https://huggingface.co/papers/2512.24601
- AlphaXiv: https://www.alphaxiv.org/resources/2512.24601v1

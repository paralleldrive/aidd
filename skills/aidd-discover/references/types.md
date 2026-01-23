# Product Manager Types Reference

## Core Types

```
UserStory = "As a $persona, I want $jobToDo, so that $benefit"
FunctionalRequirement = "Given $situation, should $jobToDo"
```

## Entity Definitions

### Persona
```yaml
id: string (cuid2)
name: string
description: string
createdAt: timestamp
updatedAt: timestamp
```

### PainPoint
```yaml
id: string
name: string
description: string
impact: 1..10      # how much this hurts
frequency: 1..10   # how often it happens
```

### UserStory
```yaml
id: string
name: string
description: string
painPoint: PainPoint
priority: number   # impact × frequency
functionalRequirements: FunctionalRequirement[]
status: backlog | inProgress | released | cancelled
```

### Step
```yaml
id: string
name: string
description: string
userStories: UserStory[]
```

### UserJourney
```yaml
id: string
name: string
description: string
personas: Persona[]
steps: Step[]
```

### StoryMap
```yaml
userJourneys: UserJourney[]
```

## Feature PRD Format

```markdown
# Feature Name

## Problem
Why are we building this?

## Solution
What are we building?

## User Journey
Step by step guide with mockups

## Requirements
User stories with functional requirements
```

# Candidate Output

Every candidate is saved to a real file in the project's prototypes folder.
Never keep candidates only in chat.

```
projects/{project}/prototypes/{artifact}/gen{N}-{short_id}/
├── index.html       # The candidate itself
├── preview.png      # Screenshot for quick comparison
└── full.png         # Full-page screenshot
```

- `{short_id}` = 8-char random alphanumeric, e.g. `gen3-a7k2m9p1`
- Generation number increments across the whole evolutionary run
- All candidates from all generations are preserved (never delete earlier gens)
- `SCORES.md` at the `{artifact}/` level tracks all candidates across generations

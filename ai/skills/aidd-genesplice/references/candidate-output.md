# Candidate Output

Every candidate is saved to a folder inside the designated prototypes folder.

cuid2Slug = ${npx @paralleldrive/cuid2 --slug}

```
prototypes/$artifactName/gen${n}-${semanticLabel}${cuid2slug}/
├── $artifactName    # The candidate itself
├── preview.png      # Screenshot for quick comparison
└── full.png         # Full-page screenshot
```

Generate screenshots when relevant, e.g. candidate has a UI.

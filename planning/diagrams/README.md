# Diagram source files (Trilium import helper)

Each `.mermaid` file in this folder is the raw source for one diagram embedded in a chapter note. Use these to recreate the diagrams as proper Mermaid notes in Trilium so they render instead of showing as code blocks.

## Why this folder exists

Trilium's markdown import puts ` ```mermaid ` fences into text notes as plain code blocks — they don't render. Trilium renders mermaid only inside its dedicated **Mermaid** note type. So we keep the chapter prose in text notes and the diagrams in Mermaid notes, then stitch them together with Trilium's include feature.

## Workflow

For each `.mermaid` file:

1. In Trilium, create a new note → choose type **Mermaid**.
2. Open the corresponding `.mermaid` file, copy its full contents, paste into the Trilium Mermaid note.
3. Save. Trilium renders the diagram in the preview pane.
4. In the chapter text note (e.g., `09-rollout-phases`):
   - Either use **Insert → Include Note** to embed the Mermaid note inline, or
   - Open the Mermaid note → **Copy image reference to clipboard** → paste into the text note. The reference stays linked to the source, so edits propagate.

## File map

| File | Used in chapter | What it shows |
|---|---|---|
| `02-overview-layman.mermaid` | 02 | Hotel-analogy flowchart with emojis |
| `02-overview-technical.mermaid` | 02 | Architecture with Web / Worker / Realtime subgraphs |
| `02-overview-sequence.mermaid` | 02 | "PDA uploads a record" end-to-end sequence |
| `04-channel-decision-tree.mermaid` | 04 | Critical / prefs / presence / dedup decision tree |
| `07-presence-sequence.mermaid` | 07 | Presence-aware fanout sequence for record.uploaded |
| `08-edit-mode-flow.mermaid` | 08 | Lease → optimistic update → conflict UI |
| `09-rollout-gantt.mermaid` | 09 | Phased rollout gantt |

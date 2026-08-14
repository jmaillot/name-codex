# Name Codex

**Naming Governance App** — Microsoft 365 & Azure naming standards, made visual.

Name Codex is a single-page application that helps you define, explore and govern naming conventions for Azure, Microsoft 365, Intune, Defender, Exchange and Groups resources. Pick an object type, assemble its segments, and the app generates, validates and documents the final name in real time.

![Name Codex screenshot](./docs/screenshot.png)

## Features

### Explore naming standards
- Browse conventions by category: Azure, Entra ID, Exchange, Groups, Intune, Conditional Access, Defender
- Search and filter object types, and switch between their pattern variants
- See the active description and an example for each convention

### Segment builder
- Visually assemble a name from segments (separator-aware)
- Segments can be **fixed** (first/last), **locked**, **recommended**, or free to reorder
- Reorder, remove or add custom segments with one click
- Infobulles (tips) on each segment label to understand what it represents
- Live pattern display with a **Modified** badge when you deviate from the convention

### Validation & governance
- Live name preview respecting the convention's validation rules (length, allowed characters, mandatory segments)
- Governance **score /100** with a per-rule checklist
- Policy examples for Conditional Access

### Output & persistence
- Copy the generated name or the full Markdown documentation to the clipboard
- Save **favorites** and keep a **history** of copied names (localStorage, persisted between sessions)
- Auto-restores the last object you selected in each category
- **Convention Reference**: a value dictionary for every segment used

### Data-driven
All conventions, segment libraries and generators are plain JSON under `src/rules`, `src/data/segments`, `src/data/generators` — add or adjust a naming standard without touching the code.

## Tech stack

React + TypeScript + Vite, with all data stored locally as JSON (no backend).
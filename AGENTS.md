# AGENTS.md

Scope: Entire repository (`/workspace/codex-workshop`).

## Project goals
- Build and maintain a simple, self-contained Snake game in plain HTML/CSS/JavaScript.
- Preserve an old-school monochrome green monitor aesthetic.

## Technical constraints
- Keep dependencies at zero (no build step, no external frameworks).
- Main runtime files should remain:
  - `index.html`
  - `styles.css`
  - `script.js`
- Prefer modern, readable vanilla JS.

## Gameplay requirements baseline
- Fully playable snake game with:
  - movement
  - food spawning
  - growth
  - wall/self collision
  - game over handling
- Controls: Arrow keys + WASD.
- UI controls: Start/Restart, Pause, difficulty, grid size.
- Scoring: score + persistent high score (`localStorage`).
- Difficulty should affect both speed and food scoring.
- Retro beep effects should be implemented with Web Audio API (no external audio files).

## Style conventions
- Monochrome green palette only.
- Keep functions small and named clearly.
- Add concise comments for non-obvious logic only.
- Avoid introducing heavy abstractions for this small app.

## Validation
- Since this is static, validate by loading `index.html` and ensuring no console errors.
- If possible, use lightweight local checks (e.g., simple lint-like review and smoke testing steps).

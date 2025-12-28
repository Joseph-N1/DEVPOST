# LEGGOOO — UI & Design Document (ui-guidelines.md)

**Purpose:** A Figma-ready design specification and handoff for LEGGOOO, covering screen-by-screen wireframes, component breakdowns, theme system (6 modes), color tokens, typography, spacing, references, and a coding-agent handoff checklist.

---

## Contents (quick view)

1. Overview & objectives
2. Screen wireframes (list & descriptions)
3. Component breakdown (props, states, events)
4. Theme system (6 mood modes + Light/Dark base)
5. Color tokens & palettes (system tokens + mode palettes)
6. Typography & spacing scale
7. Layout grid & responsive rules
8. Figma-ready structure & naming conventions
9. Assets & iconography (export guidelines)
10. Interaction patterns & microcopy
11. Accessibility checklist
12. Handoff checklist for coding agent
13. Design references & search keywords (Behance, Mobbin, UIverse, Dribbble)

---

## 1. Overview & objectives

Design a minimal, approachable web IDE with a "pixelated vibe" overlay option, per-user mood themes, and an AI assistant pane. Prioritize clarity for collaborative sessions, clear presence/ownership indicators, and an intuitive Git push flow.

## 2. Screen wireframes (screen-by-screen)

For each screen, a short description is provided. Create frames in Figma sized 1440x1024 (desktop-first), with responsive variants at 1024 and 768 widths.

### Screens list

- Landing / Marketing Preview (hero with "Sign in with GitHub/Google" CTAs)
- Dashboard (Recent workspaces, Create / Import actions, Theme selector)
- Workspace Overview (project metadata, collaborators, quick actions)
- Editor View (Main app): File tree (left), Editor (center), AI Pane & Activity (right), Top bar w/ avatars and Git controls
- File-focused view (tabbed editor with file header showing owner + current editors)
- AI Pane expanded (full-screen modal of conversation, suggestion history)
- Invite / Share modal
- Push to GitHub modal (select files, commit message)
- Settings / Profile (theme, audio, integrations, API key input)
- Public View (read-only shared session)

(Each frame includes spacing guides, component placeholders, and annotations for developer handoff.)

## 3. Component breakdown

List of atomic & composite components, with props, states, events and accessibility notes. Examples:

- TopBar: workspaceTitle, actions[], avatars[], onPushClick()
- FileTree: nodes[], selectedPath, onOpen(path), onRename(path)
- EditorWrapper (Monaco): fileContent, language, onChange, onCursorChange
- PresenceBadge: user, status, tooltip
- AIChatPane: messages[], input, onSendPrompt, onApplySuggestion
- PushModal: changedFiles[], commitMessage, onConfirm
- InviteModal: inviteType(link|github), role, expireDate
- ThemeSelector: currentTheme, onChange
- NotificationToast: message, type, duration

Each component has states (loading, empty, error, active) and events described for integration.

## 4. Theme system (per-user themes)

- Base modes: Light and Dark
- Mood Modes (per-user overrides visuals + audio): Anime, Neon City, Space Explorer, Nature Forest, Mechanical, Aviation/Aerospace
- Pixelation: Optional overlay (toggle) that applies a subtle pixel grid and reduced anti-aliasing effect.
- Theme variables: background, surface, primary, secondary, accent, text, muted, border, glow (for neon-like modes), audioTrack
- Themes are client-side only; each user independently selects their theme. Provide JSON theme tokens to be used as CSS variables.

## 5. Color tokens & palettes

- System tokens (examples):
  - --bg: #0F172A
  - --surface: #0B1220
  - --primary: #7C3AED
  - --accent: #06B6D4
  - --text: #E6EEF8
  - --muted: #9AA6B2
  - --success: #10B981
  - --warning: #F59E0B
  - --danger: #EF4444
  - --glass: rgba(255,255,255,0.04)
- Mode palettes (short examples):
  - Anime: soft pastels with warm pink accent
  - Neon City: deep navy + neon magenta / cyan accents + glow
  - Space Explorer: indigo + starlight accents + subtle gradients
  - Nature Forest: deep green backgrounds + moss accents
  - Mechanical: metallic grays + industrial orange accents
  - Aviation/Aerospace: slate + aviation blue + instrument-style highlights
- Provide full token tables in Figma styles for quick dev export.

## 6. Typography & spacing

- UI font: Inter (variable) for headings and body
- Code font: JetBrains Mono or Fira Code
- Scale:
  - base font-size: 16px
  - h1: 28px (700)
  - h2: 22px (600)
  - h3: 18px (600)
  - body: 16px (400)
  - small: 13px (400)
- Spacing scale: 4px base (xs=4, sm=8, md=16, lg=24, xl=32, xxl=48)
- Border radius tokens: r-sm:4px, r-md:8px, r-lg:16px

## 7. Layout grid & responsive rules

- Desktop-first 12-column grid, 24px gutters
- Editor center column: spans 7–8 columns; file tree 2–3 cols; AI pane 3 cols
- Collapse behavior: on <1024 width, AI pane collapses into bottom drawer; file tree collapses to hamburger.

## 8. Figma-ready structure & naming

- Pages: 00_DesignSystem, 01_Wireframes, 02_Screens, 03_Components, 04_Prototypes, 05_Assets
- Components: atomic (buttons, inputs), molecules (file-list, avatar-row), organisms (editor layout), templates (workspace page)
- Use component variants for states and a consistent naming scheme: Component / Element / State
- Tokens: export color & typography tokens as JSON for dev handoff (Tailwind config snippet)

## 9. Assets & iconography

- Use vector SVGs for icons; single-color icons that adapt to theme via `currentColor`.
- Export assets at 1x and 2x for retina. Use `icon-` prefix naming.

## 10. Interaction patterns & microcopy

- Confirm destructive actions with modal ("Are you sure you want to overwrite main?")
- Provide short contextual microcopy: e.g., "You’re editing temp branch — push to main when ready."
- Keyboard shortcuts: Cmd/Ctrl + S (save snapshot), Cmd/Ctrl + K (open command palette), Cmd/Ctrl + Shift + P (open AI prompt)

## 11. Accessibility checklist

- Color contrast at least AA; provide high-contrast themes
- Focus outlines for keyboard navigation
- Screen-reader friendly labels for major controls
- Respect prefers-reduced-motion

## 12. Handoff checklist for coding agent

Deliverables for devs/coding agent:

- Figma file with pages and components
- Exported tokens JSON (colors, typography, spacing)
- CSS variables mapping and Tailwind config snippet
- Component spec: props, events, states
- Responsive breakpoints & behavior notes
- Sample API contract (endpoints used by components)
- Interaction prototypes (click flows for push, invite, AI apply)
- Storybook-ready component list (optional)
- Accessibility checklist & test cases

## 13. Design references & search keywords

**Keywords to use on Behance, Mobbin, UIverse, Dribbble, and Pinterest:**

- "web IDE UI" / "code editor UI" / "developer tools UI"
- "collaboration dashboard" / "team collaboration UI" / "pair programming UI"
- "chat + editor" / "chat code editor" / "ai assistant UI"
- "neon cyberpunk UI" / "neon dashboard" / "futuristic ui"
- "pixel art UI" / "pixelated interface" / "retro ui"
- "nature themed UI" / "forest ui" / "calm dashboard"
- "space dashboard" / "space explorer ui" / "astronomy app ui"
- "aviation dashboard" / "cockpit ui" / "flight instrument ui"
- "anime style UI" / "kawaii ui" / "pastel ui"
- "productivity app ui" / "minimal dashboard" / "saas ui"

**Additional search hints:** combine terms like "dark mode code editor" or "minimal code IDE ui"; add "Figma" to find Figma resources, or "prototype" for interactive examples.

---

## 14. Design → Code Mapping (Skills)

<!-- updated by Claude — 2024-12-28 — added skills mapping section -->

The `docs/skills/` directory contains reference implementations for translating designs into code. Key mappings:

| Design Concept    | Skill Pack                  | Files                                     |
| ----------------- | --------------------------- | ----------------------------------------- |
| Theme tokens      | `tailwind-theming/`         | CSS variable definitions, Tailwind config |
| Theme toggle      | `theme-switching/`          | React component, localStorage persistence |
| Animations        | `animations-framer-motion/` | Motion variants, gesture handlers         |
| Reduced motion    | `motion-reduction/`         | `prefers-reduced-motion` patterns         |
| Component styling | `tailwind-design-system/`   | Tailwind component classes                |
| Figma handoff     | `figma-to-code/`            | Conversion workflow, examples             |

### Handoff Checklist

Before implementing a design:

1. Check `figma-to-code/examples.md` for conversion patterns
2. Reference `tailwind-theming/README.md` for color tokens
3. Apply `a11y-for-editors/aria-checklist.md` for accessibility
4. Use `motion-reduction/` patterns for animations

See [README_skills_index.md](README_skills_index.md) for full skill inventory.

---

_End of UI Guidelines (ui-guidelines.md)_

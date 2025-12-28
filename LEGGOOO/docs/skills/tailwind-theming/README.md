# Tailwind Theming

> Skill pack for implementing dynamic color systems and theme infrastructure with Tailwind CSS.

## Contents

| File                              | Description                                   |
| --------------------------------- | --------------------------------------------- |
| `frontend-color-system.zip`       | Color token definitions and theming utilities |
| `frontend-color-system.INDEX.txt` | Auto-generated listing of ZIP contents        |

## Overview

This skill pack covers:

- CSS custom property-based theming
- Tailwind CSS v4 theme configuration
- Dynamic color palette switching
- Contrast-aware color generation

## LEGGOOO Theme System

LEGGOOO supports 6 theme modes as defined in `ui_guidelines.md`:

| Theme                 | Description          |
| --------------------- | -------------------- |
| `system`              | Follow OS preference |
| `light`               | Default light theme  |
| `dark`                | Default dark theme   |
| `high-contrast-light` | WCAG AAA light       |
| `high-contrast-dark`  | WCAG AAA dark        |
| `custom`              | User-defined colors  |

### CSS Variables Structure

```css
:root {
  /* Semantic tokens */
  --color-bg-primary: theme("colors.slate.50");
  --color-bg-secondary: theme("colors.slate.100");
  --color-bg-editor: theme("colors.white");

  --color-text-primary: theme("colors.slate.900");
  --color-text-secondary: theme("colors.slate.600");
  --color-text-muted: theme("colors.slate.400");

  --color-border: theme("colors.slate.200");
  --color-accent: theme("colors.indigo.600");
  --color-accent-hover: theme("colors.indigo.700");

  /* Syntax highlighting */
  --syntax-keyword: theme("colors.purple.600");
  --syntax-string: theme("colors.green.600");
  --syntax-comment: theme("colors.slate.400");
  --syntax-function: theme("colors.blue.600");
}

[data-theme="dark"] {
  --color-bg-primary: theme("colors.slate.900");
  --color-bg-secondary: theme("colors.slate.800");
  --color-bg-editor: theme("colors.slate.950");

  --color-text-primary: theme("colors.slate.50");
  --color-text-secondary: theme("colors.slate.300");
  --color-text-muted: theme("colors.slate.500");

  --color-border: theme("colors.slate.700");
  --color-accent: theme("colors.indigo.400");
  --color-accent-hover: theme("colors.indigo.300");

  /* Syntax highlighting */
  --syntax-keyword: theme("colors.purple.400");
  --syntax-string: theme("colors.green.400");
  --syntax-comment: theme("colors.slate.500");
  --syntax-function: theme("colors.blue.400");
}
```

### Tailwind Configuration

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "var(--color-bg-primary)",
          secondary: "var(--color-bg-secondary)",
          editor: "var(--color-bg-editor)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
        },
        border: "var(--color-border)",
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
        },
      },
    },
  },
};
```

## Contrast Requirements

| Level      | Ratio | Use Case                 |
| ---------- | ----- | ------------------------ |
| AA Normal  | 4.5:1 | Body text                |
| AA Large   | 3:1   | Headings, UI components  |
| AAA Normal | 7:1   | High-contrast modes      |
| AAA Large  | 4.5:1 | High-contrast large text |

## Related Skills

- [theme-switching](../theme-switching/) — Theme toggle implementation
- [tailwind-design-system](../tailwind-design-system/) — Component styling
- [a11y-for-editors](../a11y-for-editors/) — Accessibility patterns

---

_Skill pack for LEGGOOO collaborative IDE_

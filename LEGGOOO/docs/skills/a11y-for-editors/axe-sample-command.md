# Axe Accessibility Testing Commands

> Automated accessibility testing setup and commands for LEGGOOO's editor components.

---

## Installation

### NPM/Yarn

```bash
# Core library
npm install --save-dev axe-core

# React integration
npm install --save-dev @axe-core/react

# Playwright integration
npm install --save-dev @axe-core/playwright

# CLI tool
npm install --save-dev @axe-core/cli
```

## React Integration

### Development Mode Setup

Add to your `main.tsx` or `App.tsx` (development only):

```tsx
// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Only run in development
if (process.env.NODE_ENV === "development") {
  import("@axe-core/react").then((axe) => {
    axe.default(React, ReactDOM, 1000); // 1 second debounce
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Configuration Options

```tsx
import React from "react";
import ReactDOM from "react-dom/client";

if (process.env.NODE_ENV === "development") {
  import("@axe-core/react").then((axe) => {
    axe.default(React, ReactDOM, 1000, {
      // Only check specific rules
      rules: [
        { id: "color-contrast", enabled: true },
        { id: "label", enabled: true },
        { id: "aria-roles", enabled: true },
      ],
      // Exclude third-party components
      exclude: [
        ["#monaco-editor"], // Monaco handles its own a11y
      ],
      // Report specific impact levels
      resultTypes: ["violations", "incomplete"],
    });
  });
}
```

## CLI Commands

### Basic Page Audit

```bash
# Audit a URL
npx axe https://localhost:3000

# Audit with specific rules
npx axe https://localhost:3000 --rules color-contrast,label

# Output to JSON file
npx axe https://localhost:3000 --save results.json

# Disable specific rules
npx axe https://localhost:3000 --disable scrollable-region-focusable
```

### CI/CD Integration

```bash
# Exit with error code on violations
npx axe https://localhost:3000 --exit

# Only fail on serious/critical issues
npx axe https://localhost:3000 --exit --tags wcag2a,wcag2aa
```

## Playwright Integration

### Test Setup

```typescript
// tests/a11y.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility Tests", () => {
  test("Editor page has no accessibility violations", async ({ page }) => {
    await page.goto("/editor");

    // Wait for editor to load
    await page.waitForSelector(".monaco-editor");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .exclude(".monaco-editor") // Monaco has internal a11y
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("File tree is accessible", async ({ page }) => {
    await page.goto("/editor");

    const results = await new AxeBuilder({ page })
      .include('[role="tree"]')
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("Tab navigation is accessible", async ({ page }) => {
    await page.goto("/editor");

    const results = await new AxeBuilder({ page })
      .include('[role="tablist"]')
      .withRules(["aria-required-attr", "aria-valid-attr"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
```

### Custom Rule Configuration

```typescript
// tests/a11y-config.ts
import AxeBuilder from "@axe-core/playwright";

export const createA11yBuilder = (page: Page) => {
  return new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"])
    .exclude([
      ".monaco-editor", // Monaco handles own a11y
      '[data-testid="loading"]', // Temporary loading states
    ])
    .disableRules([
      "region", // We handle landmark regions differently
    ]);
};
```

## Vitest Integration

### Component Testing

```typescript
// src/components/__tests__/FileTree.a11y.test.tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { FileTree } from "../FileTree";

expect.extend(toHaveNoViolations);

describe("FileTree Accessibility", () => {
  it("should have no accessibility violations", async () => {
    const { container } = render(
      <FileTree
        files={[
          {
            name: "src",
            type: "folder",
            children: [{ name: "index.tsx", type: "file" }],
          },
        ]}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("should have proper tree structure", async () => {
    const { container } = render(<FileTree files={mockFiles} />);

    const results = await axe(container, {
      rules: {
        "aria-required-attr": { enabled: true },
        "aria-valid-attr-value": { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });
});
```

## GitHub Actions Workflow

```yaml
# .github/workflows/a11y.yml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Start server
        run: npm run preview &

      - name: Wait for server
        run: npx wait-on http://localhost:4173

      - name: Run accessibility tests
        run: npx playwright test tests/a11y.spec.ts

      - name: Upload results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: a11y-results
          path: test-results/
```

## Common Violations & Fixes

### 1. Missing Form Labels

```tsx
// ❌ Violation
<input type="text" placeholder="Search..." />

// ✅ Fix
<label htmlFor="search" className="sr-only">Search files</label>
<input id="search" type="text" placeholder="Search..." />
```

### 2. Color Contrast

```css
/* ❌ Violation: 2.5:1 ratio */
.muted-text {
  color: #999;
  background: #fff;
}

/* ✅ Fix: 4.5:1 ratio */
.muted-text {
  color: #666;
  background: #fff;
}
```

### 3. Missing Button Text

```tsx
// ❌ Violation
<button><CloseIcon /></button>

// ✅ Fix
<button aria-label="Close panel">
  <CloseIcon aria-hidden="true" />
</button>
```

### 4. Invalid ARIA Attributes

```tsx
// ❌ Violation
<div role="tab" aria-selected="yes">Tab 1</div>

// ✅ Fix (boolean, not string)
<div role="tab" aria-selected={true}>Tab 1</div>
```

## Screen Reader Only (SR-Only) Utility

```css
/* Add to global styles */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

## Resources

- [Axe-core GitHub](https://github.com/dequelabs/axe-core)
- [Axe Rules Documentation](https://dequeuniversity.com/rules/axe/)
- [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing)

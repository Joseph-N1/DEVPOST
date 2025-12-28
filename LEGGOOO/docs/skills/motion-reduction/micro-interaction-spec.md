# Micro-Interaction Specification

> Timing, easing, and motion design tokens for LEGGOOO's UI interactions.

---

## Design Principles

1. **Purpose over decoration** — Every animation serves a functional purpose
2. **60fps or nothing** — Use only GPU-accelerated properties
3. **Consistent timing** — Use predefined duration/easing tokens
4. **Accessible by default** — All motions have reduced alternatives

---

## Duration Tokens

| Token                | Value   | Use Case                         |
| -------------------- | ------- | -------------------------------- |
| `--duration-instant` | `0ms`   | Reduced motion fallback          |
| `--duration-fast`    | `100ms` | Micro-interactions, hover states |
| `--duration-normal`  | `200ms` | Standard transitions             |
| `--duration-slow`    | `300ms` | Page transitions, modals         |
| `--duration-slower`  | `500ms` | Complex orchestrated animations  |

```css
:root {
  --duration-instant: 0ms;
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast: 0ms;
    --duration-normal: 0ms;
    --duration-slow: 0ms;
    --duration-slower: 0ms;
  }
}
```

---

## Easing Functions

| Token            | CSS Value                           | Description            |
| ---------------- | ----------------------------------- | ---------------------- |
| `--ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)`      | Standard (ease-in-out) |
| `--ease-in`      | `cubic-bezier(0.4, 0, 1, 1)`        | Accelerating           |
| `--ease-out`     | `cubic-bezier(0, 0, 0.2, 1)`        | Decelerating           |
| `--ease-bounce`  | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful overshoot      |
| `--ease-spring`  | `cubic-bezier(0.5, 1.5, 0.5, 1)`    | Natural spring         |

```css
:root {
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-spring: cubic-bezier(0.5, 1.5, 0.5, 1);
}
```

### Framer Motion Equivalents

```tsx
// animations/easings.ts
export const easings = {
  default: [0.4, 0, 0.2, 1],
  in: [0.4, 0, 1, 1],
  out: [0, 0, 0.2, 1],
  bounce: [0.34, 1.56, 0.64, 1],
  spring: { type: "spring", damping: 20, stiffness: 300 },
};
```

---

## Interaction Specifications

### Buttons

| State  | Property           | From | To            | Duration | Easing  |
| ------ | ------------------ | ---- | ------------- | -------- | ------- |
| Hover  | `background-color` | base | hover         | fast     | default |
| Hover  | `transform`        | none | `scale(1.02)` | fast     | default |
| Active | `transform`        | none | `scale(0.98)` | instant  | -       |
| Focus  | `outline`          | none | `2px solid`   | instant  | -       |

```tsx
// components/Button.tsx
const buttonVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

<motion.button
  variants={buttonVariants}
  initial="idle"
  whileHover="hover"
  whileTap="tap"
  transition={{ duration: 0.1 }}
/>;
```

**Reduced motion:** No scale, color change only.

---

### File Tree Items

| Interaction   | Property           | Value    | Duration | Easing  |
| ------------- | ------------------ | -------- | -------- | ------- |
| Hover         | `background-color` | gray-700 | fast     | default |
| Select        | `background-color` | blue-600 | fast     | default |
| Expand folder | `height`           | auto     | normal   | out     |
| Icon rotation | `rotate`           | 0° → 90° | fast     | default |

```tsx
// File tree expand animation
const folderVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: "auto", opacity: 1 },
};

const chevronVariants = {
  collapsed: { rotate: 0 },
  expanded: { rotate: 90 },
};
```

**Reduced motion:** Instant expand/collapse, no rotation.

---

### Editor Tabs

| Interaction        | Property            | Value    | Duration |
| ------------------ | ------------------- | -------- | -------- |
| Tab switch         | `opacity`           | 0 → 1    | fast     |
| Tab close          | `width` + `opacity` | collapse | normal   |
| Tab reorder (drag) | `x` position        | smooth   | spring   |
| Active indicator   | `x` position        | slide    | normal   |

```tsx
// Tab underline indicator
<motion.div
  layoutId="tab-indicator"
  className="absolute bottom-0 h-0.5 bg-blue-500"
  transition={{ type: "spring", damping: 30, stiffness: 300 }}
/>
```

**Reduced motion:** Instant indicator switch, no slide.

---

### Modal / Dialog

| Phase           | Property  | From | To  | Duration | Easing |
| --------------- | --------- | ---- | --- | -------- | ------ |
| Enter (overlay) | `opacity` | 0    | 1   | normal   | out    |
| Enter (content) | `opacity` | 0    | 1   | normal   | out    |
| Enter (content) | `scale`   | 0.95 | 1   | normal   | out    |
| Enter (content) | `y`       | 10px | 0   | normal   | out    |
| Exit (all)      | reverse   |      |     | fast     | in     |

```tsx
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0 },
};
```

**Reduced motion:** Opacity only, no scale/translate.

---

### Toast Notifications

| Phase        | Property     | Value     | Duration | Easing |
| ------------ | ------------ | --------- | -------- | ------ |
| Enter        | `opacity`    | 0 → 1     | normal   | out    |
| Enter        | `y`          | 20px → 0  | normal   | out    |
| Enter        | `scale`      | 0.9 → 1   | normal   | bounce |
| Auto-dismiss | progress bar | 100% → 0% | 5000ms   | linear |
| Exit         | `opacity`    | 1 → 0     | fast     | in     |
| Exit         | `y`          | 0 → -10px | fast     | in     |

```tsx
const toastVariants = {
  initial: { opacity: 0, y: 20, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10 },
};
```

**Reduced motion:** Opacity fade only.

---

### Collaborative Cursors

| Property        | Behavior               | Duration             |
| --------------- | ---------------------- | -------------------- |
| Position        | Spring interpolation   | spring (damping: 30) |
| Label appear    | Fade in                | fast                 |
| Label disappear | Fade out after 3s idle | slow                 |

```tsx
// Cursor follows with spring physics
<motion.div
  animate={{ x: cursorX, y: cursorY }}
  transition={{ type: "spring", damping: 30, stiffness: 300 }}
/>
```

**Reduced motion:** Instant position updates.

---

### Loading States

| Variant  | Animation        | Duration         | Notes                     |
| -------- | ---------------- | ---------------- | ------------------------- |
| Spinner  | `rotate: 360°`   | 1000ms, infinite | Reduced: pulse opacity    |
| Skeleton | shimmer gradient | 1500ms, infinite | Reduced: static gray      |
| Progress | width 0% → 100%  | varies           | Same in reduced           |
| Dots     | scale sequence   | 600ms, infinite  | Reduced: opacity sequence |

```tsx
// Skeleton shimmer
const shimmerVariants = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: { duration: 1.5, repeat: Infinity },
  },
};

// Reduced: static
const shimmerReducedVariants = {
  animate: { opacity: 0.5 },
};
```

---

### Page Transitions

| Transition | Enter            | Exit              | Duration |
| ---------- | ---------------- | ----------------- | -------- |
| Default    | Fade in          | Fade out          | slow     |
| Slide      | Slide from right | Slide to left     | slow     |
| Scale      | Scale up + fade  | Scale down + fade | slow     |

```tsx
// pages/_app.tsx (Next.js example)
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

<AnimatePresence mode="wait">
  <motion.div
    key={router.pathname}
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.3 }}
  >
    <Component {...pageProps} />
  </motion.div>
</AnimatePresence>;
```

**Reduced motion:** Crossfade only.

---

## Stagger Patterns

### List Items

```tsx
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05, // 50ms between items
      delayChildren: 0.1, // Wait 100ms before starting
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};
```

**Reduced motion:** No stagger, all appear at once.

---

## GPU-Accelerated Properties

**✅ Safe to animate (composited):**

- `transform` (translate, scale, rotate)
- `opacity`
- `filter` (blur, brightness)

**❌ Avoid animating (triggers layout):**

- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`
- `border-width`
- `font-size`

**⚠️ Use sparingly:**

- `background-color` (triggers paint)
- `box-shadow` (triggers paint)

---

## Testing Checklist

- [ ] All animations respect `prefers-reduced-motion`
- [ ] No animation exceeds 500ms duration
- [ ] No essential information conveyed only through motion
- [ ] Animations run at 60fps (check with DevTools Performance)
- [ ] No infinite animations without user control
- [ ] Focus states work without animations
- [ ] All transitions have proper easing (no linear for UI)

# Animations — Framer Motion

> Skill pack for implementing performant, accessible animations in LEGGOOO using Framer Motion.

## Contents

| File               | Description                                        |
| ------------------ | -------------------------------------------------- |
| `motion.zip`       | Animation patterns, variants, and gesture examples |
| `motion.INDEX.txt` | Auto-generated listing of ZIP contents             |

## Key Concepts

### Motion Variants

```tsx
const fadeSlide = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: { opacity: 0, y: -10 },
};
```

### Gesture Animations

```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400 }}
>
  Click me
</motion.button>
```

### Layout Animations

```tsx
<motion.div layout layoutId="shared-element">
  {/* Content animates position/size changes automatically */}
</motion.div>
```

## LEGGOOO Integration Points

| Feature                   | Animation Type             |
| ------------------------- | -------------------------- |
| Panel resize              | `layout` + spring physics  |
| File tree expand/collapse | `AnimatePresence` + height |
| Toast notifications       | `variants` + `exit`        |
| Modal dialogs             | `scale` + `opacity`        |
| Tab switching             | `layoutId` shared element  |

## Accessibility

- Always respect `prefers-reduced-motion` (see `motion-reduction/` skill)
- Keep durations under 300ms for UI feedback
- Avoid animations that cause layout shift during typing

## Related Skills

- [motion-reduction](../motion-reduction/) — Reduced motion preferences
- [theme-switching](../theme-switching/) — Theme transition animations

---

_Skill pack for LEGGOOO collaborative IDE_

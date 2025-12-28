# Motion Reduction (motion-reduction)

> **Skill Name:** `motion-reduction` > **Description:** Implements accessible motion patterns with `prefers-reduced-motion` support for users sensitive to vestibular motion, ensuring LEGGOOO's animations degrade gracefully.

---

## Purpose

This skill provides patterns for building animations that respect user accessibility preferences. It ensures that users who are sensitive to motion (vestibular disorders, motion sickness, cognitive load) can still use LEGGOOO comfortably while maintaining a polished experience for those who prefer animations.

## When to Use This Skill

- Adding new animations (transitions, micro-interactions)
- Implementing loading states and progress indicators
- Building notification toasts and modals
- Creating collaborative presence indicators
- Designing page transitions or panel animations
- Reviewing existing animations for accessibility

## Prerequisites

- Understanding of CSS `prefers-reduced-motion` media query
- Familiarity with Framer Motion (LEGGOOO's animation library)
- Knowledge of WCAG 2.1 Success Criterion 2.3.3 (Animation from Interactions)

## Core Principles

### 1. Progressive Enhancement

- Design functionality first, add motion second
- Animations should enhance, not enable features
- All interactions must work without animation

### 2. Respect User Preferences

- Check `prefers-reduced-motion: reduce`
- Provide instant alternatives to all animations
- Never force motion on users

### 3. Safe Motion Patterns

- Avoid parallax scrolling
- Limit spinning/rotating elements
- Reduce zoom effects
- Minimize auto-playing animations

### 4. Performance = Accessibility

- Laggy animations are disorienting
- Use GPU-accelerated properties (transform, opacity)
- Avoid layout thrashing

## Animation Categories

| Category             | Normal        | Reduced           |
| -------------------- | ------------- | ----------------- |
| **Page transitions** | Slide/fade    | Instant/crossfade |
| **Modal open/close** | Scale + fade  | Opacity only      |
| **Loading spinners** | Rotation      | Pulsing opacity   |
| **Hover effects**    | Transform     | Color change only |
| **Notifications**    | Slide in      | Appear instantly  |
| **Cursor presence**  | Smooth follow | Position jumps    |

## Related Files

- [framer-reduced-motion.md](./framer-reduced-motion.md) — Framer Motion patterns
- [css-prefers-reduced-motion.css](./css-prefers-reduced-motion.css) — CSS utility classes
- [micro-interaction-spec.md](./micro-interaction-spec.md) — Interaction timing specs

## Resources

- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [WCAG 2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions)
- [Framer Motion: Reduced Motion](https://www.framer.com/motion/guide-reduce-motion/)
- [A11y Project: Reduced Motion](https://www.a11yproject.com/posts/understanding-vestibular-disorders/)

## Source Archives

- `animations-framer-motion/motion.zip` — Animation presets and variants

# Framer Motion Reduced Motion Patterns

> React hooks and components for accessible animations in LEGGOOO.

---

## Setup: Motion Config Provider

Wrap your app with a motion-aware provider:

```tsx
// providers/MotionProvider.tsx
import { LazyMotion, domAnimation, MotionConfig } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import { createContext, useContext, useMemo } from "react";

interface MotionContextValue {
  reducedMotion: boolean;
  duration: {
    fast: number;
    normal: number;
    slow: number;
  };
}

const MotionContext = createContext<MotionContextValue | null>(null);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion() ?? false;

  const value = useMemo(
    () => ({
      reducedMotion,
      duration: {
        fast: reducedMotion ? 0 : 0.15,
        normal: reducedMotion ? 0 : 0.3,
        slow: reducedMotion ? 0 : 0.5,
      },
    }),
    [reducedMotion]
  );

  return (
    <MotionContext.Provider value={value}>
      <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>
        <LazyMotion features={domAnimation}>{children}</LazyMotion>
      </MotionConfig>
    </MotionContext.Provider>
  );
}

export function useMotionContext() {
  const ctx = useContext(MotionContext);
  if (!ctx)
    throw new Error("useMotionContext must be used within MotionProvider");
  return ctx;
}
```

---

## Animation Variants

### Fade Variants (Safe for All)

```tsx
// animations/fade.ts
import { Variants } from "framer-motion";

export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Usage - safe for reduced motion
<motion.div
  variants={fadeVariants}
  initial="initial"
  animate="animate"
  exit="exit"
>
  Content
</motion.div>;
```

### Slide Variants (With Reduced Alternative)

```tsx
// animations/slide.ts
import { Variants } from "framer-motion";

export const slideUpVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

// Reduced motion: only opacity
export const slideUpReducedVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Smart variant selector
export function useSlideVariants() {
  const { reducedMotion } = useMotionContext();
  return reducedMotion ? slideUpReducedVariants : slideUpVariants;
}
```

### Scale Variants (With Reduced Alternative)

```tsx
// animations/scale.ts
import { Variants } from "framer-motion";

export const scaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const scaleReducedVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};
```

---

## Component Examples

### Modal with Reduced Motion

```tsx
// components/Modal.tsx
import { motion, AnimatePresence } from "framer-motion";
import { useMotionContext } from "../providers/MotionProvider";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  const { reducedMotion, duration } = useMotionContext();

  const overlayVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const contentVariants = reducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, scale: 0.95, y: 10 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 10 },
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: duration.fast }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            role="dialog"
            aria-modal="true"
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: duration.normal }}
            className="relative bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

### Sidebar Panel

```tsx
// components/Sidebar.tsx
import { motion, AnimatePresence } from "framer-motion";
import { useMotionContext } from "../providers/MotionProvider";

interface SidebarProps {
  isOpen: boolean;
  children: React.ReactNode;
}

export function Sidebar({ isOpen, children }: SidebarProps) {
  const { reducedMotion, duration } = useMotionContext();

  // Full motion: slide from left
  // Reduced motion: instant appear
  const variants = reducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { x: -280, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: -280, opacity: 0 },
      };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.aside
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{
            duration: duration.normal,
            ease: reducedMotion ? "linear" : [0.4, 0, 0.2, 1],
          }}
          className="w-[280px] h-full bg-gray-900 border-r border-gray-700"
        >
          {children}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
```

### Toast Notification

```tsx
// components/Toast.tsx
import { motion } from "framer-motion";
import { useMotionContext } from "../providers/MotionProvider";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
}

export function Toast({ message, type }: ToastProps) {
  const { reducedMotion, duration } = useMotionContext();

  const variants = reducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 50, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 20, scale: 0.95 },
      };

  return (
    <motion.div
      role="alert"
      layout={!reducedMotion} // Disable layout animation if reduced
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: duration.normal }}
      className="bg-gray-800 rounded-lg px-4 py-3 shadow-lg"
    >
      {message}
    </motion.div>
  );
}
```

### Loading Spinner

```tsx
// components/Spinner.tsx
import { motion } from "framer-motion";
import { useMotionContext } from "../providers/MotionProvider";

export function Spinner({ size = 24 }: { size?: number }) {
  const { reducedMotion } = useMotionContext();

  if (reducedMotion) {
    // Reduced: pulsing opacity instead of rotation
    return (
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="rounded-full border-2 border-blue-500"
        style={{ width: size, height: size }}
        aria-label="Loading"
      />
    );
  }

  // Full motion: spinning
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="rounded-full border-2 border-blue-500 border-t-transparent"
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}
```

### Collaborative Cursor

```tsx
// components/CollabCursor.tsx
import { motion } from "framer-motion";
import { useMotionContext } from "../providers/MotionProvider";

interface CollabCursorProps {
  x: number;
  y: number;
  username: string;
  color: string;
}

export function CollabCursor({ x, y, username, color }: CollabCursorProps) {
  const { reducedMotion, duration } = useMotionContext();

  return (
    <motion.div
      // Reduced motion: instant position, no smooth following
      animate={{ x, y }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { type: "spring", damping: 30, stiffness: 300 }
      }
      className="absolute pointer-events-none z-50"
      style={{ left: 0, top: 0 }}
    >
      {/* Cursor SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={color}
        className="drop-shadow"
      >
        <path d="M5.65 3.15L20.5 12L12.5 14L9.5 21.5L5.65 3.15Z" />
      </svg>

      {/* Username label */}
      <motion.span
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="ml-4 px-2 py-1 text-xs text-white rounded"
        style={{ backgroundColor: color }}
      >
        {username}
      </motion.span>
    </motion.div>
  );
}
```

---

## Utility Hooks

### useReducedMotionValue

```tsx
// hooks/useReducedMotionValue.ts
import { useReducedMotion } from "framer-motion";

/**
 * Returns one of two values based on reduced motion preference
 */
export function useReducedMotionValue<T>(normal: T, reduced: T): T {
  const prefersReduced = useReducedMotion();
  return prefersReduced ? reduced : normal;
}

// Usage
const springConfig = useReducedMotionValue(
  { type: "spring", damping: 20 },
  { duration: 0 }
);
```

### useAnimationDuration

```tsx
// hooks/useAnimationDuration.ts
import { useReducedMotion } from "framer-motion";

export function useAnimationDuration(normalMs: number): number {
  const prefersReduced = useReducedMotion();
  return prefersReduced ? 0 : normalMs / 1000;
}

// Usage
const duration = useAnimationDuration(300); // 0.3s or 0
```

---

## Testing Reduced Motion

### Chrome DevTools

1. Open DevTools → Rendering tab
2. Find "Emulate CSS media feature prefers-reduced-motion"
3. Select "reduce"

### macOS

System Preferences → Accessibility → Display → Reduce motion

### Windows

Settings → Ease of Access → Display → Show animations in Windows (off)

### Programmatic Testing

```tsx
// tests/motion.test.tsx
import { render, screen } from "@testing-library/react";
import { MotionProvider } from "../providers/MotionProvider";

// Mock reduced motion preference
beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
});

test("spinner uses opacity animation when reduced motion", () => {
  render(
    <MotionProvider>
      <Spinner />
    </MotionProvider>
  );
  // Assert no rotation animation applied
});
```

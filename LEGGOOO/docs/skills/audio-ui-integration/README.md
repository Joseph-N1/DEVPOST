# Audio UI Integration

> Skill pack for integrating audio feedback and sound design into editor interfaces.

## Contents

| File                             | Description                                            |
| -------------------------------- | ------------------------------------------------------ |
| `unity-editor-toolkit.zip`       | Audio integration patterns and UI sound design toolkit |
| `unity-editor-toolkit.INDEX.txt` | Auto-generated listing of ZIP contents                 |

## Overview

This skill pack covers audio feedback patterns for IDE interfaces, including:

- Keystroke audio feedback (optional, accessibility feature)
- Notification sounds
- Collaboration presence audio cues
- Error/warning audio alerts
- Achievement/milestone sounds

## LEGGOOO Integration Points

### Notification Sounds

```typescript
// Audio context singleton
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Notification sound generator
function playNotification(type: "info" | "warning" | "error" | "success") {
  const frequencies = {
    info: [440, 880], // A4 → A5
    warning: [440, 330], // A4 → E4
    error: [220, 165], // A3 → E3
    success: [523, 659, 784], // C5 → E5 → G5
  };
  // ... oscillator implementation
}
```

### Collaboration Audio Cues

| Event                       | Sound Type              |
| --------------------------- | ----------------------- |
| User joins session          | Soft chime (ascending)  |
| User leaves session         | Soft chime (descending) |
| Cursor enters your viewport | Subtle tick             |
| Chat message received       | Notification ping       |

## Accessibility Considerations

- All audio must be **opt-in** (disabled by default)
- Provide visual alternatives for all audio cues
- Respect system sound settings
- Allow per-category volume control

## User Settings Schema

```typescript
interface AudioSettings {
  enabled: boolean;
  masterVolume: number; // 0-1
  categories: {
    notifications: boolean;
    collaboration: boolean;
    feedback: boolean;
  };
}
```

## Related Skills

- [a11y-for-editors](../a11y-for-editors/) — Accessibility patterns
- [theme-switching](../theme-switching/) — User preference management

---

_Skill pack for LEGGOOO collaborative IDE_

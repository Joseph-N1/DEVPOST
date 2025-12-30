import { useState, useRef, useEffect } from 'react';
import { useTheme, type AllTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Icons for different theme categories
const SunIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const PaletteIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
  </svg>
);

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function ThemeToggle({ showLabel = false, size = 'md', className = '' }: ThemeToggleProps) {
  const { toggleTheme, resolvedTheme, activeTheme } = useTheme();

  const isMoodTheme = !['light', 'dark'].includes(activeTheme);
  const Icon = isMoodTheme ? PaletteIcon : (resolvedTheme === 'dark' ? MoonIcon : SunIcon);
  const label = isMoodTheme ? activeTheme.replace('-', ' ') : resolvedTheme;

  return (
    <button
      onClick={toggleTheme}
      className={`
        inline-flex items-center gap-2 p-2 rounded-lg transition-colors
        bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]
        text-[var(--text-secondary)] hover:text-[var(--text-primary)]
        focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 focus:ring-offset-[var(--ring-offset)]
        ${className}
      `}
      title={`Current: ${label}. Click to toggle light/dark.`}
      aria-label={`Toggle theme. Currently ${label} mode.`}
    >
      <Icon className={sizeClasses[size]} />
      {showLabel && <span className="text-sm font-medium capitalize">{label}</span>}
    </button>
  );
}

// Full theme picker with all 8 themes
interface ThemePickerProps {
  className?: string;
  onSelect?: () => void;
}

export function ThemePicker({ className = '', onSelect }: ThemePickerProps) {
  const { activeTheme, setFullTheme, availableThemes } = useTheme();

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`} role="radiogroup" aria-label="Select theme">
      {availableThemes.map((t) => (
        <button
          key={t.id}
          onClick={() => {
            setFullTheme(t.id);
            onSelect?.();
          }}
          className={`
            flex flex-col items-center gap-1 p-3 rounded-lg transition-all
            ${activeTheme === t.id || (t.id === 'system' && ['light', 'dark'].includes(activeTheme))
              ? 'bg-[var(--accent)] text-white ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-primary)]'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
            }
            focus:outline-none
          `}
          role="radio"
          aria-checked={activeTheme === t.id}
        >
          <span className="text-lg">{getThemeEmoji(t.id)}</span>
          <span className="text-xs font-medium">{t.name}</span>
        </button>
      ))}
    </div>
  );
}

function getThemeEmoji(theme: AllTheme): string {
  const emojis: Record<AllTheme, string> = {
    light: '☀️',
    dark: '🌙',
    system: '💻',
    anime: '🌸',
    'neon-city': '🌃',
    'space-explorer': '🚀',
    'nature-forest': '🌲',
    mechanical: '⚙️',
    aviation: '✈️',
  };
  return emojis[theme] || '🎨';
}

// Dropdown with all themes
interface ThemeDropdownProps {
  className?: string;
}

export function ThemeDropdown({ className = '' }: ThemeDropdownProps) {
  const { activeTheme, setFullTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentTheme = availableThemes.find(t => t.id === activeTheme) || availableThemes[0];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2 px-3 py-2 rounded-lg
          bg-[var(--bg-tertiary)] text-[var(--text-primary)]
          border border-[var(--border-default)] hover:border-[var(--accent)]
          focus:outline-none focus:ring-2 focus:ring-[var(--ring)]
          cursor-pointer text-sm font-medium transition-colors
        "
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span>{getThemeEmoji(currentTheme.id)}</span>
        <span>{currentTheme.name}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="
          absolute top-full left-0 mt-1 w-56 py-1 z-50
          bg-[var(--bg-secondary)] border border-[var(--border-default)]
          rounded-lg shadow-lg animate-slide-down
        " role="listbox">
          {availableThemes.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setFullTheme(t.id);
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2 text-left transition-colors
                ${activeTheme === t.id
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                }
              `}
              role="option"
              aria-selected={activeTheme === t.id}
            >
              <span>{getThemeEmoji(t.id)}</span>
              <div className="flex-1">
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs opacity-70">{t.description}</div>
              </div>
              {activeTheme === t.id && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Simple selector list
interface ThemeSelectorProps {
  className?: string;
}

export function ThemeSelector({ className = '' }: ThemeSelectorProps) {
  const { activeTheme, setFullTheme, availableThemes } = useTheme();

  return (
    <div className={`flex flex-col gap-1 ${className}`} role="radiogroup" aria-label="Select theme">
      {availableThemes.map((t) => (
        <button
          key={t.id}
          onClick={() => setFullTheme(t.id)}
          className={`
            flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
            ${activeTheme === t.id
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
            }
            focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 focus:ring-offset-[var(--ring-offset)]
          `}
          role="radio"
          aria-checked={activeTheme === t.id}
        >
          <span>{getThemeEmoji(t.id)}</span>
          <div className="flex-1 text-left">
            <span className="text-sm font-medium">{t.name}</span>
            <span className="text-xs opacity-70 ml-2">{t.description}</span>
          </div>
          {activeTheme === t.id && (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}

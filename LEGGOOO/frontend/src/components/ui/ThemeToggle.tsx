import { useTheme, Theme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const THEMES: { value: Theme; label: string; icon: React.ReactNode }[] = [
  {
    value: 'light',
    label: 'Light',
    icon: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    ),
  },
  {
    value: 'system',
    label: 'System',
    icon: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
];

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function ThemeToggle({ showLabel = false, size = 'md', className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme, resolvedTheme } = useTheme();

  // Get current theme icon
  const currentTheme = THEMES.find((t) => t.value === theme) || THEMES[1];

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
      title={`Current: ${currentTheme.label}. Click to switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode.`}
      aria-label={`Toggle theme. Currently ${currentTheme.label} mode.`}
    >
      <span className={sizeClasses[size]}>{currentTheme.icon}</span>
      {showLabel && <span className="text-sm font-medium">{currentTheme.label}</span>}
    </button>
  );
}

interface ThemeSelectorProps {
  className?: string;
}

export function ThemeSelector({ className = '' }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={`flex flex-col gap-1 ${className}`}
      role="radiogroup"
      aria-label="Select theme"
    >
      {THEMES.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          className={`
            flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
            ${theme === t.value
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
            }
            focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 focus:ring-offset-[var(--ring-offset)]
          `}
          role="radio"
          aria-checked={theme === t.value}
        >
          <span className="w-5 h-5">{t.icon}</span>
          <span className="text-sm font-medium">{t.label}</span>
          {theme === t.value && (
            <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}

// Dropdown menu version for compact spaces
interface ThemeDropdownProps {
  className?: string;
}

export function ThemeDropdown({ className = '' }: ThemeDropdownProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={`relative ${className}`}>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as Theme)}
        className="
          appearance-none px-3 py-2 pr-8 rounded-lg
          bg-[var(--bg-tertiary)] text-[var(--text-primary)]
          border border-[var(--border)] hover:border-[var(--accent)]
          focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 focus:ring-offset-[var(--ring-offset)]
          cursor-pointer text-sm font-medium
        "
        aria-label="Select theme"
      >
        {THEMES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[var(--text-secondary)]">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

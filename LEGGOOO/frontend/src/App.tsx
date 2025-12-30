import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { WorkspacePage } from './pages';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { AuthCallbackPage } from './pages/auth/AuthCallbackPage';
import { AuthErrorPage } from './pages/auth/AuthErrorPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ThemeToggle, ThemeDropdown } from './components/ui/ThemeToggle';
import { SkipLink } from './hooks/useAccessibility';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="system">
        <AuthProvider>
          <SkipLink href="#main-content">Skip to main content</SkipLink>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/auth/error" element={<AuthErrorPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workspace/:workspaceId"
              element={
                <ProtectedRoute>
                  <WorkspacePage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

// GitHub Icon
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

// Landing page component
function LandingPage() {
  const { isAuthenticated, signInWithGitHub } = useAuth();
  const { activeTheme } = useTheme();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      signInWithGitHub();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[var(--accent)] opacity-10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[var(--accent)] opacity-10 rounded-full blur-3xl" />
        {activeTheme === 'neon-city' && (
          <>
            <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[var(--accent)] to-transparent opacity-20" />
            <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-[var(--accent)] to-transparent opacity-20" />
          </>
        )}
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚀</span>
              <span className="text-xl font-bold text-[var(--accent)]">LEGGOOO</span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeDropdown />
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="btn btn-primary"
                >
                  Dashboard
                </Link>
              ) : (
                <button onClick={signInWithGitHub} className="btn btn-primary">
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="relative pt-16">
        {/* Hero section */}
        <section className="min-h-[90vh] flex items-center justify-center px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-fade-in">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                Code Together,{' '}
                <span className={`text-[var(--accent)] ${activeTheme === 'neon-city' ? 'neon-text' : ''}`}>
                  Build Faster
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
                Real-time collaborative IDE for small teams. 
                AI-powered assistance, beautiful themes, seamless GitHub integration.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-up">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn btn-primary px-8 py-4 text-lg">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <button
                    onClick={handleGetStarted}
                    className={`btn btn-primary px-8 py-4 text-lg flex items-center gap-2 ${activeTheme === 'neon-city' ? 'glow' : ''}`}
                  >
                    <GitHubIcon className="w-5 h-5" />
                    Get Started Free
                  </button>
                  <Link
                    to="/workspace/demo"
                    className="btn btn-secondary px-8 py-4 text-lg"
                  >
                    Try Demo
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <span className="text-[var(--success)]">●</span>
                <span>&lt;250ms latency</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--accent)]">●</span>
                <span>5 editors per file</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--warning)]">●</span>
                <span>8 beautiful themes</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
              Everything you need to code together
            </h2>
            <p className="text-[var(--text-secondary)] text-center mb-16 max-w-2xl mx-auto">
              Built for small teams who want a lightweight, fast, and beautiful collaborative coding experience.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon="⚡"
                title="Real-time Sync"
                description="See your teammates' cursors and edits instantly. Powered by Yjs for conflict-free collaboration."
              />
              <FeatureCard
                icon="🤖"
                title="AI Assistant"
                description="Get code explanations, suggestions, and debugging help right in your editor."
              />
              <FeatureCard
                icon="🎨"
                title="8 Themes"
                description="From Neon City cyberpunk to Nature Forest earth tones. Find your coding vibe."
              />
              <FeatureCard
                icon="📁"
                title="File Management"
                description="Create, edit, and organize files with a familiar tree structure."
              />
              <FeatureCard
                icon="💾"
                title="Version Snapshots"
                description="Save important checkpoints and restore previous versions anytime."
              />
              <FeatureCard
                icon="♿"
                title="Accessible"
                description="Full keyboard navigation, screen reader support, and reduced motion options."
              />
            </div>
          </div>
        </section>

        {/* Theme showcase */}
        <section className="py-24 px-4 bg-[var(--bg-secondary)]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
              Express yourself with themes
            </h2>
            <p className="text-[var(--text-secondary)] text-center mb-12">
              Choose from 8 carefully crafted themes. Currently viewing: <span className="text-[var(--accent)] font-semibold capitalize">{activeTheme.replace('-', ' ')}</span>
            </p>
            
            <div className="flex justify-center mb-8">
              <ThemeDropdown />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: 'Light', color: '#f8fafc', textColor: '#0f172a' },
                { name: 'Dark', color: '#0f172a', textColor: '#f8fafc' },
                { name: 'Anime', color: '#fef3f2', textColor: '#4c1d95' },
                { name: 'Neon City', color: '#0a0a0f', textColor: '#00ff88' },
                { name: 'Space', color: '#020617', textColor: '#3b82f6' },
                { name: 'Forest', color: '#1a2e1a', textColor: '#4ade80' },
                { name: 'Mechanical', color: '#18181b', textColor: '#f59e0b' },
                { name: 'Aviation', color: '#0c1929', textColor: '#38bdf8' },
              ].map((theme) => (
                <div
                  key={theme.name}
                  className="p-4 rounded-lg border border-[var(--border-default)] transition-transform hover:scale-105"
                  style={{ backgroundColor: theme.color }}
                >
                  <span className="text-sm font-medium" style={{ color: theme.textColor }}>
                    {theme.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to code together?
            </h2>
            <p className="text-[var(--text-secondary)] mb-8">
              Join teams already using LEGGOOO for real-time collaboration.
            </p>
            <button
              onClick={handleGetStarted}
              className={`btn btn-primary px-8 py-4 text-lg flex items-center gap-2 mx-auto ${activeTheme === 'neon-city' ? 'glow' : ''}`}
            >
              <GitHubIcon className="w-5 h-5" />
              {isAuthenticated ? 'Go to Dashboard' : 'Start Coding Now'}
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-[var(--border-default)]">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span>🚀</span>
              <span className="font-semibold text-[var(--accent)]">LEGGOOO</span>
              <span className="text-[var(--text-muted)]">• Built for DevPost Hackathon 2025</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
              <span>React + Monaco + Yjs</span>
              <ThemeToggle size="sm" />
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

// Feature card component
function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="card card-hover p-6">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)]">{description}</p>
    </div>
  );
}

export default App;

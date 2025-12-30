import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { WorkspacePage } from './pages';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { AuthCallbackPage } from './pages/auth/AuthCallbackPage';
import { AuthErrorPage } from './pages/auth/AuthErrorPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { SkipLink } from './hooks/useAccessibility';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="system">
        <AuthProvider>
          <SkipLink href="#main-content">Skip to main content</SkipLink>
          <Routes>
            <Route path="/" element={<Home />} />
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

// Landing page
function Home() {
  const { isAuthenticated, signInWithGitHub } = useAuth();
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
      {/* Header with theme toggle */}
      <header className="absolute top-0 right-0 p-4">
        <ThemeToggle />
      </header>
      
      <main id="main-content" className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-2xl px-4">
          <h1 className="text-6xl font-bold mb-4">
            <span className="text-[var(--accent)]" aria-hidden="true">🚀</span> LEGGOOO
          </h1>
          <p className="text-xl text-[var(--text-muted)] mb-8">
            Real-Time Collaborative Coding IDE for Small Teams
          </p>
          <p className="text-[var(--text-muted)] mb-8">
            Code together in real-time with your team. Built-in AI assistant, 
            GitHub integration, and beautiful themes.
          </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-8 py-4 bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/workspace/demo"
                className="px-8 py-4 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg font-medium border border-[var(--border-default)] hover:border-[var(--accent)] transition-colors"
              >
                Try Demo Workspace
              </Link>
              <button
                className="px-8 py-4 bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                onClick={handleGetStarted}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                Sign in with GitHub
              </button>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-6 bg-[var(--bg-secondary)] rounded-lg">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-semibold mb-2">Real-time Sync</h3>
            <p className="text-sm text-[var(--text-muted)]">
              See teammates' cursors and edits instantly with &lt;250ms latency
            </p>
          </div>
          <div className="p-6 bg-[var(--bg-secondary)] rounded-lg">
            <div className="text-2xl mb-2">🤖</div>
            <h3 className="font-semibold mb-2">AI Assistant</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Local-first AI helps explain, improve, and debug your code
            </p>
          </div>
          <div className="p-6 bg-[var(--bg-secondary)] rounded-lg">
            <div className="text-2xl mb-2">🎨</div>
            <h3 className="font-semibold mb-2">8 Beautiful Themes</h3>
            <p className="text-sm text-[var(--text-muted)]">
              From Neon City to Nature Forest - code in your style
            </p>
          </div>
        </div>

        <p className="mt-12 text-sm text-[var(--text-muted)]">
          Built with React + Monaco + Yjs | Max 5 editors per file
        </p>
      </div>
    </main>
    </div>
  );
}

export default App;

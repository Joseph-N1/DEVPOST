/**
 * Login Page
 * GitHub OAuth login
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// GitHub icon component
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export function LoginPage() {
  const { signInWithGitHub, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect destination
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, from]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--accent)] border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent)] opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent)] opacity-5 rounded-full blur-3xl"></div>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo and title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[var(--accent)] mb-2">LEGGOOO</h1>
            <p className="text-[var(--text-secondary)]">Collaborative Code Editor</p>
          </div>
          
          {/* Login card */}
          <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] p-8">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2 text-center">
              Welcome back
            </h2>
            <p className="text-[var(--text-secondary)] text-sm text-center mb-6">
              Sign in to continue to your workspaces
            </p>
            
            {/* GitHub OAuth button */}
            <button
              onClick={signInWithGitHub}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#24292e] hover:bg-[#2f363d] text-white rounded-lg transition-colors"
            >
              <GitHubIcon className="w-5 h-5" />
              <span>Continue with GitHub</span>
            </button>
            
            {/* Additional info */}
            <p className="text-xs text-[var(--text-secondary)] text-center mt-6">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
          
          {/* Features list */}
          <div className="mt-8 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-4">What you get:</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <span className="text-[var(--accent)]">✓</span>
                <span>Real-time collaboration</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <span className="text-[var(--accent)]">✓</span>
                <span>AI code assistance</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <span className="text-[var(--accent)]">✓</span>
                <span>GitHub integration</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <span className="text-[var(--accent)]">✓</span>
                <span>8 beautiful themes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="text-center py-4 text-sm text-[var(--text-secondary)]">
        © 2025 LEGGOOO. Built for DevPost Hackathon.
      </footer>
    </div>
  );
}

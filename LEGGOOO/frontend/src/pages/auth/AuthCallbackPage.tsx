/**
 * Auth Callback Page
 * Handles OAuth redirect and token storage
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const expiresIn = searchParams.get('expiresIn');
    const errorMsg = searchParams.get('error');
    
    if (errorMsg) {
      setError(decodeURIComponent(errorMsg));
      return;
    }
    
    if (accessToken && refreshToken && expiresIn) {
      // Tokens are handled by AuthContext, redirect to dashboard
      navigate('/dashboard', { replace: true });
    } else {
      setError('Authentication failed. Missing tokens.');
    }
  }, [searchParams, navigate]);
  
  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Authentication Error
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--accent)] border-t-transparent rounded-full"></div>
        <p className="text-[var(--text-secondary)]">Completing sign in...</p>
      </div>
    </div>
  );
}

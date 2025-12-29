/**
 * Auth Error Page
 * Shows authentication errors
 */

import { useNavigate, useSearchParams } from 'react-router-dom';

export function AuthErrorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const error = searchParams.get('error') || 'An unknown error occurred';
  
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] p-8 text-center">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          Authentication Failed
        </h1>
        <p className="text-[var(--text-secondary)] mb-6">
          {decodeURIComponent(error)}
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}

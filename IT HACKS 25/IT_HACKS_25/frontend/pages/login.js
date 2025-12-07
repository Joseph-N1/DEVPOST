import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient';

export default function LoginPage() {
  const [email, setEmail] = useState('joseph123nimyel@gmail.com');
  const [password, setPassword] = useState('password');
  const [selectedRole, setSelectedRole] = useState('viewer');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const user = await login(email, password);
      setSuccess(`✓ Logged in as ${user.email} (${user.role})`);
      
      setTimeout(() => {
        const redirect = router.query.redirect || '/dashboard';
        router.push(redirect);
      }, 500);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setForgotLoading(true);

    try {
      await apiClient.post('/auth/forgot-password', { email: forgotEmail });
      setSuccess('✓ Password reset link sent to your email!');
      setForgotEmail('');
      setTimeout(() => setShowForgotPassword(false), 3000);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Password reset endpoint is being configured. Please contact support.');
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Unable to process password reset. Please try again.');
      }
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            🐔 ECO FARM
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {showForgotPassword ? 'Reset your password' : 'Sign in to your account'}
          </p>
        </div>

        {!showForgotPassword ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 p-3 rounded text-xs text-gray-600">
              <p className="font-semibold mb-2 text-blue-900">📋 Demo Credentials:</p>
              <p className="mb-1">Email: <code className="bg-white px-2 py-1 rounded text-blue-600 font-mono text-xs">joseph123nimyel@gmail.com</code></p>
              <p>Password: <code className="bg-white px-2 py-1 rounded text-blue-600 font-mono text-xs">password</code></p>
            </div>

            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Login as Role
                </label>
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                >
                  <option value="viewer">👁️ Viewer (Read-only access)</option>
                  <option value="manager">📊 Manager (Can upload CSVs)</option>
                  <option value="admin">🔐 Admin (Full system access)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Note: Your actual role is determined by the administrator. Change it from your profile page.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="space-y-2 text-center text-sm">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-green-600 hover:text-green-500 font-medium block w-full"
              >
                🔐 Forgot your password?
              </button>
              <div>
                <span className="text-gray-600">Don't have an account? </span>
                <Link href="/register" className="font-medium text-green-600 hover:text-green-500">
                  Register here
                </Link>
              </div>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="your@email.com"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={forgotLoading}
                className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

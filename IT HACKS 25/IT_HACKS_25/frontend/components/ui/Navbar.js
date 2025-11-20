// frontend/components/ui/Navbar.js
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const { t, ready } = useTranslation();
  const { user, logout, hasRole, isAuthenticated } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Ensure translations and client environment are ready before render
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !ready) {
    // Prevent hydration mismatch by rendering nothing until ready
    return null;
  }

  // Role-based navigation links
  const navLinks = [
    { href: "/dashboard", label: t("dashboard"), roles: ['viewer', 'manager', 'admin'] },
    { href: "/analytics", label: t("analytics_page"), roles: ['viewer', 'manager', 'admin'] },
    { href: "/reports", label: t("reports"), roles: ['manager', 'admin'] },
    { href: "/upload", label: "Upload", roles: ['manager', 'admin'] },
    { href: "/audit", label: "Audit Logs", roles: ['admin'] },
    { href: "/how", label: t("how_it_works"), roles: ['viewer', 'manager', 'admin'] },
  ].filter(link => !link.roles || link.roles.some(role => hasRole(role)));

  return (
    <nav className="sticky top-0 bg-white shadow-sm z-50">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section – Logo / Title */}
          <Link 
            href="/" 
            className="flex items-center text-xl sm:text-2xl font-extrabold text-green-700 tracking-tight hover:scale-105 transition-all duration-200"
          >
            🌾 {t("app_title")}
          </Link>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden md:flex md:items-center md:space-x-1 lg:space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-lg transition-all duration-200 font-medium text-gray-700 hover:bg-green-100 hover:text-green-700 hover:scale-105"
              >
                {link.label}
              </Link>
            ))}
            
            {/* User Menu */}
            {isAuthenticated && (
              <div className="relative ml-3">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 font-medium text-gray-700 hover:bg-green-100 hover:text-green-700"
                >
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0)}
                  </div>
                  <span className="hidden lg:inline">{user?.full_name || user?.email}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {user?.role?.toUpperCase()}
                      </span>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      👤 Profile
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {!isAuthenticated && (
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-all duration-200"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button - Visible on mobile only */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-green-100 hover:text-green-700 transition-all duration-200"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu - Collapsible */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100">
            <div className="flex flex-col space-y-2 pt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg transition-all duration-200 font-medium text-gray-700 hover:bg-green-100 hover:text-green-700 hover:scale-[1.02]"
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Mobile User Menu */}
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-3 border-t border-gray-100 mt-2">
                    <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {user?.role?.toUpperCase()}
                    </span>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-lg transition-all duration-200 font-medium text-gray-700 hover:bg-green-100 hover:text-green-700"
                  >
                    👤 Profile
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg transition-all duration-200 font-medium text-red-600 hover:bg-red-50"
                  >
                    🚪 Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-all duration-200 text-center"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

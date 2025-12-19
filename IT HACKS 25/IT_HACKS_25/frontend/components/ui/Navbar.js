// frontend/components/ui/Navbar.js
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function Navbar() {
  const { t, ready } = useTranslation();
  const { user, logout, hasRole, isAuthenticated } = useAuth();
  const { theme, currentTheme, setTheme, themes, getSuggestedTheme } = useTheme();
  const [isClient, setIsClient] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef(null);

  // Ensure translations and client environment are ready before render
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Close theme menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isClient || !ready) {
    // Prevent hydration mismatch by rendering nothing until ready
    return null;
  }

  // Get navbar background based on theme
  const getNavbarBg = () => {
    if (currentTheme === 'dark') {
      return 'bg-gray-900/95 backdrop-blur-md border-b border-gray-800';
    }
    return 'bg-white/95 backdrop-blur-md shadow-sm';
  };

  const getTextColor = () => {
    if (currentTheme === 'dark') {
      return 'text-gray-100';
    }
    return 'text-gray-700';
  };

  const getHoverBg = () => {
    if (currentTheme === 'dark') {
      return 'hover:bg-gray-800 hover:text-emerald-400';
    }
    return 'hover:bg-green-100 hover:text-green-700';
  };

  // Role-based navigation links
  const navLinks = [
    { href: "/dashboard", label: t("dashboard"), roles: ['viewer', 'manager', 'admin'] },
    { href: "/analytics", label: "📈 Analytics", roles: ['viewer', 'manager', 'admin'] },
    { href: "/features", label: "🎯 Features", roles: ['viewer', 'manager', 'admin'] },
    { href: "/monitor-dashboard", label: "📊 Monitor", roles: ['viewer', 'manager', 'admin'] },
    { href: "/reports", label: t("reports"), roles: ['manager', 'admin'] },
    { href: "/upload", label: "Upload", roles: ['manager', 'admin'] },
    { href: "/audit", label: "Audit Logs", roles: ['admin'] },
    { href: "/how", label: t("how_it_works"), roles: ['viewer', 'manager', 'admin'] },
  ].filter(link => !link.roles || link.roles.some(role => hasRole(role)));

  const suggestedTheme = getSuggestedTheme();

  return (
    <nav className={`sticky top-0 z-50 transition-colors duration-300 ${getNavbarBg()}`}>
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section – Logo / Title */}
          <Link 
            href="/" 
            className={`flex items-center text-xl sm:text-2xl font-extrabold tracking-tight hover:scale-105 transition-all duration-200 ${currentTheme === 'dark' ? 'text-emerald-400' : 'text-green-700'}`}
          >
            🌾 {t("app_title")}
          </Link>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden md:flex md:items-center md:space-x-1 lg:space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg transition-all duration-200 font-medium ${getTextColor()} ${getHoverBg()} hover:scale-105`}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Theme Selector */}
            <div className="relative" ref={themeMenuRef}>
              <button
                onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-200 font-medium ${getTextColor()} ${getHoverBg()}`}
                title="Change theme"
              >
                <span className="text-xl">{theme?.emoji || '🌙'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {themeMenuOpen && (
                <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl py-2 z-50 border ${
                  currentTheme === 'dark' 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className={`px-4 py-2 border-b ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                    <p className={`text-xs font-medium ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      🎨 Select Theme
                    </p>
                  </div>
                  
                  {Object.values(themes).map((themeOption) => (
                    <button
                      key={themeOption.id}
                      onClick={() => {
                        setTheme(themeOption.id);
                        setThemeMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                        currentTheme === themeOption.id
                          ? currentTheme === 'dark'
                            ? 'bg-emerald-900/50 text-emerald-400'
                            : 'bg-green-100 text-green-700'
                          : currentTheme === 'dark'
                            ? 'text-gray-300 hover:bg-gray-700'
                            : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="flex items-center space-x-3">
                        <span className="text-xl">{themeOption.emoji}</span>
                        <span className="font-medium">{themeOption.name}</span>
                      </span>
                      {currentTheme === themeOption.id && (
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {themeOption.id === suggestedTheme && currentTheme !== themeOption.id && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                          Suggested
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* User Menu */}
            {isAuthenticated && (
              <div className="relative ml-3">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 font-medium ${getTextColor()} ${getHoverBg()}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                    currentTheme === 'dark' ? 'bg-emerald-600' : 'bg-green-500'
                  }`}>
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0)}
                  </div>
                  <span className="hidden lg:inline">{user?.full_name || user?.email}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 z-50 ${
                    currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
                  }`}>
                    <div className={`px-4 py-2 border-b ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                      <p className={`text-sm font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user?.full_name}</p>
                      <p className={`text-xs ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
                        currentTheme === 'dark' ? 'bg-emerald-900 text-emerald-400' : 'bg-green-100 text-green-800'
                      }`}>
                        {user?.role?.toUpperCase()}
                      </span>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className={`block px-4 py-2 text-sm ${currentTheme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      👤 Profile
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm text-red-500 ${currentTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
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
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  currentTheme === 'dark' 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button - Visible on mobile only */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-all duration-200 ${getTextColor()} ${getHoverBg()}`}
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
          <div className={`md:hidden pb-4 border-t ${currentTheme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
            <div className="flex flex-col space-y-2 pt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg transition-all duration-200 font-medium ${getTextColor()} ${getHoverBg()} hover:scale-[1.02]`}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Mobile Theme Selector */}
              <div className={`px-4 py-3 border-t ${currentTheme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
                <p className={`text-xs font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  🎨 Theme
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(themes).map((themeOption) => (
                    <button
                      key={themeOption.id}
                      onClick={() => {
                        setTheme(themeOption.id);
                      }}
                      className={`flex flex-col items-center p-2 rounded-lg text-sm transition-all ${
                        currentTheme === themeOption.id
                          ? currentTheme === 'dark'
                            ? 'bg-emerald-900/50 ring-2 ring-emerald-500'
                            : 'bg-green-100 ring-2 ring-green-500'
                          : currentTheme === 'dark'
                            ? 'bg-gray-800 hover:bg-gray-700'
                            : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <span className="text-2xl mb-1">{themeOption.emoji}</span>
                      <span className={`text-xs ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {themeOption.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Mobile User Menu */}
              {isAuthenticated ? (
                <>
                  <div className={`px-4 py-3 border-t ${currentTheme === 'dark' ? 'border-gray-800' : 'border-gray-100'} mt-2`}>
                    <p className={`text-sm font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user?.full_name}</p>
                    <p className={`text-xs ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
                      currentTheme === 'dark' ? 'bg-emerald-900 text-emerald-400' : 'bg-green-100 text-green-800'
                    }`}>
                      {user?.role?.toUpperCase()}
                    </span>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-lg transition-all duration-200 font-medium ${getTextColor()} ${getHoverBg()}`}
                  >
                    👤 Profile
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 font-medium text-red-500 ${
                      currentTheme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-red-50'
                    }`}
                  >
                    🚪 Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 text-center text-white ${
                    currentTheme === 'dark' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
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

// frontend/components/ui/Navbar.js
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { t, ready } = useTranslation();
  const [isClient, setIsClient] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Ensure translations and client environment are ready before render
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !ready) {
    // Prevent hydration mismatch by rendering nothing until ready
    return null;
  }

  const navLinks = [
    { href: "/dashboard", label: t("dashboard") },
    { href: "/analytics", label: t("analytics_page") },
    { href: "/reports", label: t("reports") },
    { href: "/how", label: t("how_it_works") },
  ];

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
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

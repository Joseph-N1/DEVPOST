// frontend/components/layout/DashboardLayout.js
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, BarChart3, Upload, Home } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function DashboardLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { t, ready } = useTranslation();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const navItems = [
    { name: t ? t("dashboard", "Dashboard") : "Dashboard", href: "/dashboard", icon: <Home size={18} /> },
    { name: t ? t("upload", "Upload") : "Upload", href: "/upload", icon: <Upload size={18} /> },
    { name: t ? t("analytics", "Analytics") : "Analytics", href: "/analytics", icon: <BarChart3 size={18} /> },
  ];

  // don't render i18n-sensitive parts until ready on client to avoid hydration mismatch
  if (!isClient || !ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-sky-100 text-gray-800">
        <main className="p-6">
          <div className="max-w-7xl mx-auto w-full">
            {/* placeholder to reduce layout shift */}
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-green-50 via-white to-sky-100 text-gray-800">
      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out bg-white/95 backdrop-blur-md shadow-lg w-64 z-30 flex flex-col`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <Link href="/" className="text-lg font-bold text-green-700">
            🌾 {t("app_title", "IT Hacks 25 Dashboard")}
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 text-gray-600 hover:text-green-600"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-green-100 hover:text-green-700 transition"
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 text-sm text-gray-500">
          © {new Date().getFullYear()} Eco-Tech Labs
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-3 bg-white/70 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-green-700"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-green-700 leading-tight">
              {title ?? t("dashboard", "Dashboard")}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:inline">{t("welcome", "Welcome")}</span>
            <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-semibold">
              U
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

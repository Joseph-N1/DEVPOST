"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, BarChart3, Upload, Home } from "lucide-react"; // if you have lucide-react installed

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: <Home size={18} /> },
    { name: "Upload Data", href: "/upload", icon: <Upload size={18} /> },
    { name: "Analytics", href: "/dashboard/analytics", icon: <BarChart3 size={18} /> },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-green-50 via-white to-sky-100 text-gray-800">
      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out bg-white/90 backdrop-blur-md shadow-lg w-64 z-20 flex flex-col`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-xl font-bold text-green-700">Eco-Tech Dash</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 text-gray-600 hover:text-green-600"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-green-100 hover:text-green-700 transition"
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Eco-Tech Labs
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-3 bg-white/70 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-green-700"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-xl font-semibold text-green-700">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Welcome back, User!</span>
            <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-semibold">
              U
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

import React from "react";
import Link from "next/link";

/**
 * DashboardHeader
 * 
 * A reusable header for dashboard-like pages.
 * Supports title, optional subtitle, and an action button (e.g., Upload CSV).
 * 
 * Props:
 * - title (string): main page title
 * - subtitle (string): optional smaller text
 * - actionLabel (string): button text
 * - actionHref (string): button link (default: '/upload')
 */
export default function DashboardHeader({
  title = "Dashboard",
  subtitle,
  actionLabel = "Upload CSV",
  actionHref = "/upload",
}) {
  return (
    <header className="bg-white/70 backdrop-blur-md border border-green-100 shadow-sm rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-green-700 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-gray-600 text-sm mt-1">{subtitle}</p>
        )}
      </div>

      <Link
        href={actionHref}
        className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow transition"
      >
        {actionLabel}
      </Link>
    </header>
  );
}

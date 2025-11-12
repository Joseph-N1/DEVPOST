// frontend/components/ui/Navbar.js
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { t, ready } = useTranslation();
  const [isClient, setIsClient] = useState(false);

  // Ensure translations and client environment are ready before render
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !ready) {
    // Prevent hydration mismatch by rendering nothing until ready
    return null;
  }

  return (
    <nav className="sticky top-0 bg-white shadow-sm z-50">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Left Section – Logo / Title */}
        <Link href="/" className="text-2xl font-extrabold text-green-700 tracking-tight">
          🌾 {t("app_title")}
        </Link>

        {/* Right Section – Navigation */}
        <div className="flex space-x-4">
          <Link href="/dashboard" className="px-3 py-2 rounded-lg transition-all duration-200 font-medium text-gray-700 hover:bg-green-100 hover:text-green-700">
            {t("dashboard")}
          </Link>
          <Link href="/analytics" className="px-3 py-2 rounded-lg transition-all duration-200 font-medium text-gray-700 hover:bg-green-100 hover:text-green-700">
            {t("analytics")}
          </Link>
          <Link href="/reports" className="px-3 py-2 rounded-lg transition-all duration-200 font-medium text-gray-700 hover:bg-green-100 hover:text-green-700">
            {t("reports")}
          </Link>
          <Link href="/how" className="px-3 py-2 rounded-lg transition-all duration-200 font-medium text-gray-700 hover:bg-green-100 hover:text-green-700">
            {t("how_it_works")}
          </Link>
        </div>
      </div>
    </nav>
  );
}

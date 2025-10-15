import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang) => i18n.changeLanguage(lang);

  const linkClass = (path) =>
    `px-3 py-2 rounded-lg transition-all duration-200 font-medium ${
      router.pathname === path
        ? "bg-green-600 text-white shadow-md"
        : "text-gray-700 hover:bg-green-100 hover:text-green-700"
    }`;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-gradient-to-r from-green-50 via-white to-sky-50 border-b border-green-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Left Section – Logo / Title */}
        <Link href="/" className="text-2xl font-extrabold text-green-700 tracking-tight">
          🌾 {t("app_title")}
        </Link>

        {/* Center Section – Navigation Links */}
        <div className="flex gap-4">
          <Link href="/upload" className={linkClass("/upload")}>
            {t("upload")}
          </Link>
          <Link href="/dashboard" className={linkClass("/dashboard")}>
            {t("dashboard")}
          </Link>
        </div>

        {/* Right Section – Language Switcher */}
        <div className="flex gap-2">
          {["en", "ha", "yo", "ig"].map((lang) => (
            <button
              key={lang}
              onClick={() => changeLanguage(lang)}
              className={`px-2 py-1 text-sm border rounded transition-all duration-200 ${
                i18n.language === lang
                  ? "bg-green-600 text-white border-green-700"
                  : "border-green-300 hover:bg-green-100 text-green-700"
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

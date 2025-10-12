import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang) => i18n.changeLanguage(lang);

  return (
    <nav className="flex justify-between items-center px-6 py-3 bg-gray-900 text-white shadow-md">
      <h1 className="text-2xl font-bold">{t("app_title")}</h1>
      <div className="flex gap-4">
        <Link href="/upload" className="hover:text-blue-400 transition">
          {t("upload")}
        </Link>
        <Link href="/dashboard" className="hover:text-green-400 transition">
          {t("dashboard")}
        </Link>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => changeLanguage("en")}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-800"
        >
          EN
        </button>
        <button
          onClick={() => changeLanguage("ha")}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-800"
        >
          HA
        </button>
        <button
          onClick={() => changeLanguage("yo")}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-800"
        >
          YO
        </button>
        <button
          onClick={() => changeLanguage("ig")}
          className="px-2 py-1 text-sm border rounded hover:bg-gray-800"
        >
          IG
        </button>
      </div>
    </nav>
  );
}

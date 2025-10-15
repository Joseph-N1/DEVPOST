import { useTranslation } from "react-i18next";
import Link from "next/link";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-12 bg-gradient-to-r from-green-50 via-white to-sky-50 border-t border-green-100 shadow-inner">
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between text-sm text-gray-600">
        <p className="mb-3 md:mb-0">
          © {new Date().getFullYear()} 🌾 {t("app_title")} — {t("footer_rights") || "All rights reserved"}
        </p>

        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-green-700 transition">
            {t("privacy") || "Privacy Policy"}
          </Link>
          <Link href="/about" className="hover:text-green-700 transition">
            {t("about") || "About"}
          </Link>
          <Link href="/contact" className="hover:text-green-700 transition">
            {t("contact") || "Contact"}
          </Link>
        </div>
      </div>
    </footer>
  );
}

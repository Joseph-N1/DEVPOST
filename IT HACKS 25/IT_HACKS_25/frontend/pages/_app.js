// frontend/pages/_app.js
import "@/styles/globals.css";
import dynamic from "next/dynamic";
import "../i18n"; // your existing i18n setup
import { useEffect } from "react";
import { useRouter } from "next/router";

// Dynamically import Navbar and Layout to disable SSR for i18n components
const Layout = dynamic(() => import("@/components/ui/Layout"), { ssr: false });
const Navbar = dynamic(() => import("@/components/ui/Navbar"), { ssr: false });

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    console.log(`Navigated to: ${router.pathname}`);
  }, [router.pathname]);

  return (
    <Layout>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <Component {...pageProps} />
      </main>
    </Layout>
  );
}

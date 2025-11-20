// frontend/pages/_app.js
import "@/styles/globals.css";
import dynamic from "next/dynamic";
import "../i18n"; // your existing i18n setup
import { useEffect } from "react";
import { useRouter } from "next/router";
import { AuthProvider } from "@/contexts/AuthContext";

// Dynamically import Navbar and Layout to disable SSR for i18n components
const Layout = dynamic(() => import("@/components/ui/Layout"), { ssr: false });
const Navbar = dynamic(() => import("@/components/ui/Navbar"), { ssr: false });

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    console.log(`Navigated to: ${router.pathname}`);
  }, [router.pathname]);

  // Phase 9: Register service worker for PWA
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      import('@/lib/pwa/registerServiceWorker').then(({ registerServiceWorker }) => {
        registerServiceWorker();
      }).catch(err => {
        console.error('[PWA] Failed to load service worker registration:', err);
      });
    }
  }, []);

  // Pages that don't need Navbar/Layout
  const noLayoutPages = ['/login', '/register'];
  const isNoLayoutPage = noLayoutPages.includes(router.pathname);

  return (
    <AuthProvider>
      {isNoLayoutPage ? (
        <Component {...pageProps} />
      ) : (
        <Layout>
          <Navbar />
          <main className="min-h-screen bg-gray-50">
            <Component {...pageProps} />
          </main>
        </Layout>
      )}
    </AuthProvider>
  );
}

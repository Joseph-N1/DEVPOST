import Navbar from "../ui/Navbar";
import Footer from "../ui/Footer";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 via-white to-sky-50 text-gray-800">
      {/* Top navigation */}
      <Navbar />

      {/* Main page content */}
      <main className="flex-1 container mx-auto px-6 py-8 transition-all duration-300 ease-in-out">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

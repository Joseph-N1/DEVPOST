import Navbar from '../ui/Navbar';
import Footer from '../ui/Footer';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50 to-green-50">
      <Navbar className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-green-100" />
      <main className="flex-grow">
        {children}
      </main>
      <Footer className="bg-white/80 backdrop-blur-sm border-t border-green-100" />
    </div>
  )
}

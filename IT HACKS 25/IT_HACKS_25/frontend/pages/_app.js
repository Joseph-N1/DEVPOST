import "../styles/globals.css";
import "../i18n";
import Navbar from "../components/ui/Navbar";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Navbar />
      <div className="p-6">
        <Component {...pageProps} />
      </div>
    </>
  );
}

export default MyApp;

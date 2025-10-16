import "../styles/globals.css";
import "../i18n";
import Navbar from "../components/ui/Navbar";
import Layout from "../components/layout/Layout";
// ✅ Import custom CSS for layout and charts
import "../styles/dashboard.css";
import "../styles/charts.css";

function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;

import "../styles/globals.css";
import "../i18n";
import Navbar from "../components/ui/Navbar";
import Layout from "../components/layout/Layout";

function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;

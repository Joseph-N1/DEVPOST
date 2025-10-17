import '@/styles/globals.css';
import '@/i18n';
import Layout from '@/components/layout/Layout';
// Custom styles for components
import '@/styles/dashboard.css';
import '@/styles/charts.css';

export default function App({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { useTranslation } from 'react-i18next';

export default function ReportsPage() {
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await axios.get(`${apiBase.replace(/\/+$/, '')}/upload/files`);
        setFiles(res.data || []);
      } catch (err) {
        console.error('Failed to load files', err);
      }
    };
    fetchFiles();
  }, []);

  const previewFile = async (path) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await axios.get(`${apiBase.replace(/\/+$/, '')}/upload/preview/${encodeURIComponent(path)}?rows=10`);
      setPreview(res.data);
    } catch (err) {
      console.error('Preview failed', err);
      setPreview({ error: err.message });
    }
  };

  return (
    <Layout>
      <main className="page-container">
        <header className="dashboard-header mb-4">
          <h1 className="text-xl md:text-2xl font-bold">{t('reports.title', 'Reports')}</h1>
        </header>

        <section className="dashboard-grid">
          <Card className="card-min-h">
            <h3 className="font-semibold mb-2">{t('reports.available_files', 'Available CSV files')}</h3>
            <ul className="space-y-2">
              {files.length === 0 && <li className="text-sm text-gray-500">No files found</li>}
              {files.map((f) => (
                <li key={f.path} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{f.filename}</div>
                    <div className="text-xs text-gray-500">{f.type} • {f.size} bytes</div>
                  </div>
                  <div>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => previewFile(f.path)}>Preview</button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="card-min-h">
            <h3 className="font-semibold mb-2">{t('reports.preview_intro', 'Preview')}</h3>
            <div className="text-sm text-gray-700 max-h-64 overflow-auto">
              {preview == null && <div className="text-gray-500">Select a file to preview its first rows.</div>}
              {preview && preview.error && <div className="text-red-600">{preview.error}</div>}
              {preview && preview.preview_rows && (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      {preview.columns.map((c) => <th key={c} className="text-left pr-4 font-medium">{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview_rows.map((r, i) => (
                      <tr key={i} className="odd:bg-gray-50">
                        {preview.columns.map((c) => <td key={c} className="pr-4 py-1">{String(r[c] ?? '')}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </section>
      </main>
    </Layout>
  );
}

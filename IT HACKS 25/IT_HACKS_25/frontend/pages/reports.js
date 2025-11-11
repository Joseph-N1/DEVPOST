import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { useTranslation } from 'react-i18next';

export default function ReportsPage() {
  const { t } = useTranslation();

  return (
    <Layout>
      <main className="page-container">
        <header className="dashboard-header mb-4">
          <h1 className="text-xl md:text-2xl font-bold">{t('reports.title', 'Reports')}</h1>
        </header>

        <section className="dashboard-grid">
          <Card className="card-min-h">
            {/* filters, date-range, export controls */}
            <div>{t('reports.filters_intro', 'Use filters to narrow data')}</div>
          </Card>

          <Card className="card-min-h">
            {/* file preview */}
            <div>{t('reports.preview_intro', 'Select a file to preview')}</div>
          </Card>
        </section>
      </main>
    </Layout>
  );
}

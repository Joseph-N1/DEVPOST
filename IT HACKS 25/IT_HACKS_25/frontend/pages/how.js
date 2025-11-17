import React from "react";
import { motion } from "framer-motion";
import Layout from "@/components/layout/DashboardLayout";
import { useTranslation } from "react-i18next";
import DashboardHeader from "@/components/ui/DashboardHeader";
import DashboardSection from "@/components/ui/DashboardSection";
import GlassCard from "@/components/ui/GlassCard";
import { BarChart3, Upload, LineChart, Egg, TrendingUp, FileSpreadsheet } from "lucide-react";

export default function HowPage() {
  const { t } = useTranslation();

  const steps = [
    { icon: <Upload className="w-6 h-6 text-green-700" />, title: "1. Upload Data", desc: "Start by uploading your CSV file containing poultry data." },
    { icon: <FileSpreadsheet className="w-6 h-6 text-green-700" />, title: "2. Data Processing", desc: "The system processes your CSV to extract key metrics." },
    { icon: <LineChart className="w-6 h-6 text-green-700" />, title: "3. Analysis & Visualization", desc: "Interactive charts show growth, feed efficiency, and more." },
    { icon: <Egg className="w-6 h-6 text-green-700" />, title: "4. Egg Insights", desc: "Track production, sales, and yield efficiency over time." },
    { icon: <TrendingUp className="w-6 h-6 text-green-700" />, title: "5. Performance Dashboard", desc: "Real-time tracking with weekly updates." },
    { icon: <BarChart3 className="w-6 h-6 text-green-700" />, title: "6. Export & Improve", desc: "Export analyzed data for continuous improvement." },
  ];

  const features = [
    {
      title: "Data Upload",
      icon: <Upload className="w-8 h-8 text-green-600" />,
      description: "Upload your poultry farm data in CSV format",
      steps: [
        "Prepare CSV with required metrics (bird count, weight, feed, etc.)",
        "Navigate to Upload page",
        "Drop file or browse to select",
        "Review data preview before confirming"
      ]
    },
    {
      title: "Analytics Dashboard",
      icon: <BarChart3 className="w-8 h-8 text-blue-600" />,
      description: "View comprehensive farm performance metrics",
      steps: [
        "Monitor real-time production metrics",
        "Track bird growth and health trends",
        "Analyze feed conversion rates",
        "Review environmental conditions"
      ]
    },
    {
      title: "Reports & Export",
      icon: <FileSpreadsheet className="w-8 h-8 text-purple-600" />,
      description: "Generate and download detailed reports",
      steps: [
        "Filter data by date range",
        "Select relevant metrics",
        "Preview filtered data",
        "Export in CSV/PDF/JSON formats"
      ]
    }
  ];

  const bestPractices = [
    {
      title: "Data Management",
      items: [
        "Update measurements daily for accuracy",
        "Use consistent units of measurement",
        "Double-check values before uploading",
        "Maintain backup copies of your data"
      ]
    },
    {
      title: "Performance Monitoring",
      items: [
        "Review analytics weekly",
        "Track growth trends closely",
        "Monitor feed efficiency",
        "Document environmental changes"
      ]
    }
  ];

  return (
    <Layout>
      <main className="page-container">
        <header className="dashboard-header mb-4">
          <h1 className="text-xl md:text-2xl font-bold">{t('how.title', 'How it works')}</h1>
        </header>

        <section className="dashboard-grid">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="responsive-card card-min-h">
              <h2 className="text-base md:text-lg font-semibold">{t('how.quickstart', 'Quick Start')}</h2>
              <p className="text-sm md:text-base">{t('how.quickstart_desc', 'Upload data, view analytics, generate reports.')}</p>
            </div>

            <div className="responsive-card card-min-h">
              <h2 className="text-base md:text-lg font-semibold">{t('how.steps_title', 'How it works')}</h2>
              <ol className="mt-3 space-y-2 list-decimal list-inside text-sm text-gray-700">
                {steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-green-50 rounded-md">{s.icon}</div>
                    <div>
                      <div className="font-semibold">{s.title}</div>
                      <div className="text-sm text-gray-600">{s.desc}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Feature list rendered below */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
            {features.map((f, idx) => (
              <GlassCard key={idx} className="p-6">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{f.icon}</div>
                  <div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="text-sm text-gray-600">{f.description}</p>
                  </div>
                </div>

                <ul className="mt-3 list-disc list-inside text-sm text-gray-700">
                  {f.steps.map((step, sIdx) => (
                    <li key={sIdx}>{step}</li>
                  ))}
                </ul>
              </GlassCard>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}

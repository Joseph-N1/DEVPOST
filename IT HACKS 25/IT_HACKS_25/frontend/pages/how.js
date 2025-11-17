import React from "react";
import Layout from "@/components/layout/DashboardLayout";
import PageContainer from "@/components/ui/PageContainer";
import Card from "@/components/ui/Card";
import { useTranslation } from "react-i18next";
import { BarChart3, Upload, LineChart, Egg, TrendingUp, FileSpreadsheet, CheckCircle } from "lucide-react";

export default function HowPage() {
  const { t } = useTranslation();

  const steps = [
    { 
      icon: <Upload className="w-8 h-8 text-green-600" />, 
      title: "Upload Your Data", 
      desc: "Start by uploading your CSV file containing poultry farm data. The system supports multiple formats and validates your data automatically.",
      emoji: "📤"
    },
    { 
      icon: <FileSpreadsheet className="w-8 h-8 text-blue-600" />, 
      title: "Data Processing", 
      desc: "Our intelligent system processes your CSV to extract key metrics like bird count, weight, feed consumption, and more.",
      emoji: "⚙️"
    },
    { 
      icon: <LineChart className="w-8 h-8 text-purple-600" />, 
      title: "Analysis & Visualization", 
      desc: "View interactive charts showing growth patterns, feed efficiency, mortality rates, and environmental conditions.",
      emoji: "📊"
    },
    { 
      icon: <Egg className="w-8 h-8 text-yellow-600" />, 
      title: "Production Insights", 
      desc: "Track egg production, sales, and yield efficiency over time with comprehensive analytics.",
      emoji: "🥚"
    },
    { 
      icon: <TrendingUp className="w-8 h-8 text-green-600" />, 
      title: "Performance Dashboard", 
      desc: "Monitor real-time metrics with weekly updates and trend indicators for informed decision-making.",
      emoji: "📈"
    },
    { 
      icon: <BarChart3 className="w-8 h-8 text-indigo-600" />, 
      title: "Export & Improve", 
      desc: "Export analyzed data in multiple formats and receive AI-powered recommendations for optimization.",
      emoji: "💾"
    },
  ];

  const features = [
    {
      title: "Data Upload",
      icon: <Upload className="w-10 h-10 text-green-600" />,
      description: "Upload your poultry farm data in CSV format with ease",
      emoji: "📤",
      steps: [
        "Prepare CSV with required metrics (bird count, weight, feed, etc.)",
        "Navigate to Upload page via the navigation menu",
        "Drop file or browse to select from your device",
        "Review data preview and confirm upload"
      ]
    },
    {
      title: "Analytics Dashboard",
      icon: <BarChart3 className="w-10 h-10 text-blue-600" />,
      description: "View comprehensive farm performance metrics in real-time",
      emoji: "📊",
      steps: [
        "Monitor real-time production metrics and KPIs",
        "Track bird growth and health trends over time",
        "Analyze feed conversion rates and efficiency",
        "Review environmental conditions and correlations"
      ]
    },
    {
      title: "Reports & Export",
      icon: <FileSpreadsheet className="w-10 h-10 text-purple-600" />,
      description: "Generate and download detailed performance reports",
      emoji: "📋",
      steps: [
        "Filter data by custom date ranges",
        "Select specific metrics and KPIs",
        "Preview filtered data before export",
        "Download in CSV, PDF, or JSON formats"
      ]
    }
  ];

  const bestPractices = [
    {
      title: "Data Management",
      emoji: "🗂️",
      items: [
        "Update measurements daily for maximum accuracy",
        "Use consistent units of measurement across all entries",
        "Double-check values before uploading to avoid errors",
        "Maintain regular backup copies of your data files"
      ]
    },
    {
      title: "Performance Monitoring",
      emoji: "📈",
      items: [
        "Review analytics dashboard at least weekly",
        "Track growth trends closely and identify patterns",
        "Monitor feed efficiency and conversion ratios",
        "Document environmental changes that affect performance"
      ]
    }
  ];

  return (
    <Layout>
      <PageContainer wide>
        {/* Hero Section */}
        <div className="mb-14 text-center animate-fade-in-up">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
            🌾 {t('how.title', 'How It Works')}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            {t('how.subtitle', 'Learn how to leverage the IT Hacks 25 Dashboard to optimize your poultry farm operations with data-driven insights')}
          </p>
        </div>

        {/* Quick Start Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
          <Card className="p-6 lg:p-8 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl" aria-hidden="true">🚀</span>
              <h2 className="text-xl lg:text-2xl font-semibold text-green-700">{t('how.quickstart', 'Quick Start')}</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              {t('how.quickstart_desc', 'Get started in minutes! Simply upload your farm data CSV, and our intelligent system will automatically process and visualize your metrics. View analytics, generate reports, and receive AI-powered recommendations instantly.')}
            </p>
          </Card>

          <Card className="p-6 lg:p-8 bg-gradient-to-br from-green-50 to-blue-50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl" aria-hidden="true">💡</span>
              <h2 className="text-xl lg:text-2xl font-semibold text-green-700">{t('how.benefits', 'Key Benefits')}</h2>
            </div>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Real-time performance tracking and monitoring</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>AI-powered insights and recommendations</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Interactive charts and visualizations</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Multi-format data export capabilities</span>
              </li>
            </ul>
          </Card>
        </div>

        {/* Step-by-Step Guide */}
        <div className="mb-16">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-6 lg:mb-8 text-center">
            {t('how.steps_title', 'Step-by-Step Guide')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <Card 
                key={i} 
                className="p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 rounded-xl">
                    {s.icon}
                  </div>
                  <span className="text-2xl" aria-hidden="true">{s.emoji}</span>
                </div>
                <div className="mb-2">
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full mb-2">
                    Step {i + 1}
                  </span>
                  <h3 className="font-bold text-lg text-gray-800">{s.title}</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-6 lg:mb-8 text-center">
            ✨ {t('how.features', 'Key Features')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, idx) => (
              <Card 
                key={idx} 
                className="p-6 lg:p-8 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl">
                    {f.icon}
                  </div>
                  <span className="text-3xl" aria-hidden="true">{f.emoji}</span>
                </div>
                <h3 className="font-bold text-xl mb-2 text-gray-800">{f.title}</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{f.description}</p>
                <ul className="space-y-2.5">
                  {f.steps.map((step, sIdx) => (
                    <li key={sIdx} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>

        {/* Best Practices Section */}
        <div className="mb-16">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-6 lg:mb-8 text-center">
            🎯 {t('how.best_practices', 'Best Practices')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bestPractices.map((bp, idx) => (
              <Card 
                key={idx} 
                className="p-6 lg:p-8 bg-gradient-to-br from-white to-green-50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl" aria-hidden="true">{bp.emoji}</span>
                  <h3 className="font-bold text-xl text-green-700">{bp.title}</h3>
                </div>
                <ul className="space-y-3">
                  {bp.items.map((item, iIdx) => (
                    <li key={iIdx} className="flex items-start gap-3 text-sm text-gray-700">
                      <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-green-100 text-green-700 rounded-full font-semibold">
                        {iIdx + 1}
                      </span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div>
          <Card className="p-12 bg-gradient-to-r from-green-600 to-blue-600 text-white text-center hover:shadow-2xl transition-all duration-300">
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-base lg:text-lg mb-6 opacity-90">
              Upload your first CSV file and experience the power of data-driven poultry farm management!
            </p>
            <a 
              href="/upload" 
              className="inline-block px-8 py-3 bg-white text-green-700 font-semibold rounded-lg hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Upload Data Now →
            </a>
          </Card>
        </div>
      </PageContainer>
    </Layout>
  );
}

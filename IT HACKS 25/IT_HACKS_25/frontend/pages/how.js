import React from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/ui/DashboardHeader";
import DashboardSection from "@/components/ui/DashboardSection";
import GlassCard from "@/components/ui/GlassCard";
import { BarChart3, Upload, LineChart, Egg, TrendingUp, FileSpreadsheet } from "lucide-react";

export default function HowPage() {
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
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <DashboardHeader
          title="How It Works"
          subtitle="Your guide to effective poultry farm management"
          actionLabel="Go to Dashboard"
          actionHref="/dashboard"
        />

        {/* Core Features */}
        <DashboardSection
          title="Core Features"
          subtitle="Essential tools for farm management"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <GlassCard className="h-full">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-50 p-2 rounded-lg">
                        {feature.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-gray-600">{feature.description}</p>
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700">Key Steps:</h4>
                      <ul className="space-y-1">
                        {feature.steps.map((step, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-sm text-gray-600">
                            <span className="text-green-500 font-bold">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </DashboardSection>

        {/* Best Practices */}
        <DashboardSection
          title="Best Practices"
          subtitle="Maximize the value of your farm data"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bestPractices.map((practice, index) => (
              <GlassCard key={index}>
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {practice.title}
                  </h3>
                  <ul className="space-y-2">
                    {practice.items.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-gray-600">
                        <span className="text-green-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </GlassCard>
            ))}
          </div>
        </DashboardSection>

        {/* Getting Started Guide */}
        <DashboardSection
          title="Quick Start Guide"
          subtitle="Start managing your farm in minutes"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <GlassCard>
                  <div className="flex flex-col items-center text-center p-6 space-y-4">
                    <div className="bg-green-100 rounded-full p-3">{step.icon}</div>
                    <h3 className="text-lg font-semibold text-green-800">{step.title}</h3>
                    <p className="text-gray-600 text-sm">{step.desc}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </DashboardSection>

        {/* FAQ Section */}
        <DashboardSection
          title="Frequently Asked Questions"
          subtitle="Quick answers to common questions"
        >
          <GlassCard>
            <div className="divide-y divide-gray-200">
              {[
                {
                  q: "How often should I update my farm data?",
                  a: "We recommend updating your data daily for the most accurate analytics and insights."
                },
                {
                  q: "What file formats are supported for data upload?",
                  a: "Currently, we support CSV files with specific column headers. Check the upload page for format details."
                },
                {
                  q: "Can I export my analytics data?",
                  a: "Yes, you can export data in CSV, PDF, or JSON formats from the Reports page."
                },
                {
                  q: "How do I interpret the analytics graphs?",
                  a: "Each graph comes with tooltips and legends. Hover over data points for detailed information."
                }
              ].map((faq, index) => (
                <div key={index} className="p-6">
                  <h4 className="font-medium text-gray-900 mb-2">{faq.q}</h4>
                  <p className="text-gray-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </DashboardSection>
      </div>
    </DashboardLayout>
  );
}

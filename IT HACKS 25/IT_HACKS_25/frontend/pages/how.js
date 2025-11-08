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

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <DashboardHeader
          title="How It Works"
          subtitle="Understand the poultry data tracking process step-by-step"
          actionLabel="Go to Dashboard"
          actionHref="/dashboard"
        />

        <DashboardSection
          title="Step-by-Step Workflow"
          subtitle="See how your data flows through the system"
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
                  <div className="flex flex-col items-center text-center p-4 space-y-3">
                    <div className="bg-green-100 rounded-full p-3">{step.icon}</div>
                    <h3 className="text-lg font-semibold text-green-800">{step.title}</h3>
                    <p className="text-gray-600 text-sm">{step.desc}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </DashboardSection>
      </div>
    </DashboardLayout>
  );
}

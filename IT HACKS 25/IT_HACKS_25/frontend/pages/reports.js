"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import dynamic from 'next/dynamic';
import Layout from '@/components/layout/DashboardLayout';
import PageContainer from "@/components/ui/PageContainer";
import Card from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import DateRangePicker from '@/components/ui/DateRangePicker';
import RefreshButton from '@/components/ui/RefreshButton';
import { useTranslation } from 'react-i18next';
import { Download, Trophy, TrendingUp, TrendingDown, AlertTriangle, FileJson, FileSpreadsheet, ChevronDown, FileText } from 'lucide-react';

export default function ReportsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [roomReports, setRoomReports] = useState([]);
  const [rankings, setRankings] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [aiPredictions, setAiPredictions] = useState({});
  const [selectedKPI, setSelectedKPI] = useState('eggs');
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        
        // Fetch the most recent CSV file
        const filesResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/upload/files`
        );
        
        const files = filesResponse.data || [];
        
        if (!files || files.length === 0) {
          setLoading(false);
          return;
        }

        const sortedFiles = files.sort(
          (a, b) => new Date(b.modified) - new Date(a.modified)
        );
        const latestFile = sortedFiles[0];

        // Build URL with date range if set
        let url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/upload/preview/${encodeURIComponent(latestFile.path)}?rows=3000`;
        if (dateRange) {
          url += `&start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`;
        }

        // Fetch full data
        const dataResponse = await axios.get(url);

        const csvData = dataResponse.data.preview_rows || [];
        const roomIds = [...new Set(csvData.map(row => row.room_id))].sort();

        // Compute per-room statistics
        const reports = roomIds.map(roomId => {
          const roomRows = csvData.filter(row => row.room_id === roomId);
          
          const totalEggs = roomRows.reduce((sum, row) => sum + (parseFloat(row.eggs_produced) || 0), 0);
          const avgWeight = roomRows.reduce((sum, row) => sum + (parseFloat(row.avg_weight_kg) || 0), 0) / roomRows.length;
          const avgFCR = roomRows.reduce((sum, row) => sum + (parseFloat(row.fcr) || 0), 0) / roomRows.length;
          const avgTemp = roomRows.reduce((sum, row) => sum + (parseFloat(row.temperature_c) || 0), 0) / roomRows.length;
          const avgHumidity = roomRows.reduce((sum, row) => sum + (parseFloat(row.humidity_pct) || 0), 0) / roomRows.length;
          const totalFeed = roomRows.reduce((sum, row) => sum + (parseFloat(row.feed_kg_total) || 0), 0);
          
          const latestRow = roomRows[roomRows.length - 1];
          const currentBirds = latestRow.birds_end || 0;
          const totalMortality = latestRow.cumulative_mortality || 0;
          const mortalityRate = parseFloat(latestRow.mortality_rate) || 0;

          // Peak production day
          const peakEggs = Math.max(...roomRows.map(row => parseFloat(row.eggs_produced) || 0));
          const peakDay = roomRows.find(row => parseFloat(row.eggs_produced) === peakEggs)?.age_days || 0;

          return {
            roomId,
            totalEggs: Math.round(totalEggs),
            avgWeight: avgWeight.toFixed(2),
            avgFCR: avgFCR.toFixed(2),
            totalMortality: Math.round(totalMortality),
            mortalityRate: mortalityRate.toFixed(2),
            avgTemp: avgTemp.toFixed(1),
            avgHumidity: avgHumidity.toFixed(1),
            totalFeed: totalFeed.toFixed(1),
            peakEggs: Math.round(peakEggs),
            peakDay: Math.round(peakDay),
            currentBirds,
            daysTracked: roomRows.length
          };
        });

        setRoomReports(reports);

        // Compute rankings
        const rankByEggs = [...reports].sort((a, b) => b.totalEggs - a.totalEggs);
        const rankByWeight = [...reports].sort((a, b) => parseFloat(b.avgWeight) - parseFloat(a.avgWeight));
        const rankByFCR = [...reports].sort((a, b) => parseFloat(a.avgFCR) - parseFloat(b.avgFCR)); // Lower is better
        const rankByMortality = [...reports].sort((a, b) => parseFloat(a.mortalityRate) - parseFloat(b.mortalityRate)); // Lower is better

        setRankings({
          eggs: rankByEggs,
          weight: rankByWeight,
          fcr: rankByFCR,
          mortality: rankByMortality
        });

        // Fetch AI predictions for each room
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        try {
          const aiResults = await Promise.allSettled(
            roomIds.map(roomId =>
              axios.get(`${apiBase}/api/analysis/rooms/${roomId}/predict`)
                .then(res => ({ roomId, data: res.data }))
                .catch(err => ({ roomId, error: err.message }))
            )
          );

          const predictions = {};
          aiResults.forEach(result => {
            if (result.status === 'fulfilled' && result.value.data) {
              predictions[result.value.roomId] = result.value.data;
            }
          });
          setAiPredictions(predictions);
        } catch (aiError) {
          console.warn('AI predictions unavailable:', aiError);
        }

        // Generate recommendations
        const recs = [];
        reports.forEach(report => {
          // High mortality
          if (parseFloat(report.mortalityRate) > 2.0) {
            recs.push({
              roomId: report.roomId,
              type: 'warning',
              category: 'Health',
              message: `Room ${report.roomId} has high mortality rate (${report.mortalityRate}%). Review biosecurity measures and ventilation.`
            });
          }

          // High temperature
          if (parseFloat(report.avgTemp) > 28) {
            recs.push({
              roomId: report.roomId,
              type: 'warning',
              category: 'Environment',
              message: `Room ${report.roomId} average temperature is ${report.avgTemp}°C. Consider improving cooling systems.`
            });
          }

          // Low egg production
          if (report.totalEggs < reports[0].totalEggs * 0.7) {
            recs.push({
              roomId: report.roomId,
              type: 'warning',
              category: 'Production',
              message: `Room ${report.roomId} egg production (${report.totalEggs}) is below average. Check feed quality and lighting schedule.`
            });
          }

          // Poor FCR
          if (parseFloat(report.avgFCR) > 2.5) {
            recs.push({
              roomId: report.roomId,
              type: 'warning',
              category: 'Feed Efficiency',
              message: `Room ${report.roomId} FCR is ${report.avgFCR}. Review feed formulation and feeding schedule.`
            });
          }

          // Good performance
          if (parseFloat(report.mortalityRate) < 1.0 && parseFloat(report.avgFCR) < 2.0) {
            recs.push({
              roomId: report.roomId,
              type: 'success',
              category: 'Performance',
              message: `Room ${report.roomId} shows excellent performance! Maintain current management practices.`
            });
          }
        });

        setRecommendations(recs);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchReportData();
  }, [dateRange]);

  const exportCSV = () => {
    // Generate CSV export
    let csvContent = "Room ID,Total Eggs,Avg Weight (kg),Avg FCR,Total Mortality,Mortality Rate (%),Avg Temp (°C),Avg Humidity (%),Peak Eggs,Peak Day\n";
    
    roomReports.forEach(report => {
      csvContent += `${report.roomId},${report.totalEggs},${report.avgWeight},${report.avgFCR},${report.totalMortality},${report.mortalityRate},${report.avgTemp},${report.avgHumidity},${report.peakEggs},${report.peakDay}\n`;
    });

    csvContent += "\n\nRecommendations\n";
    csvContent += "Room ID,Category,Message\n";
    recommendations.forEach(rec => {
      csvContent += `${rec.roomId},${rec.category},"${rec.message}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `farm_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    // Generate JSON export with full metadata
    const data = {
      farmId: 'FARM_001',
      exportDate: new Date().toISOString(),
      generatedBy: 'IT Hacks 25 Dashboard',
      summary: {
        totalRooms: roomReports.length,
        totalRecommendations: recommendations.length
      },
      rooms: roomReports.map(report => ({
        roomId: report.roomId,
        metrics: {
          totalEggs: report.totalEggs,
          averageWeight: parseFloat(report.avgWeight),
          feedConversionRatio: parseFloat(report.avgFCR),
          totalMortality: report.totalMortality,
          mortalityRate: parseFloat(report.mortalityRate),
          averageTemperature: parseFloat(report.avgTemp),
          averageHumidity: parseFloat(report.avgHumidity),
          peakEggProduction: report.peakEggs,
          peakProductionDay: report.peakDay,
          currentBirdCount: report.currentBirds,
          daysTracked: report.daysTracked
        }
      })),
      recommendations: recommendations.map(rec => ({
        roomId: rec.roomId,
        type: rec.type,
        category: rec.category,
        message: rec.message
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `farm_report_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const exportPDF = async () => {
    // Dynamic imports for client-side only
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    // Manually attach autoTable if it's not already on the prototype
    if (typeof jsPDF.API.autoTable === 'undefined') {
      jsPDF.API.autoTable = autoTable;
    }
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const today = new Date().toLocaleDateString();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(34, 139, 34);
    doc.text('IT Hacks 25 - Farm Performance Report', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${today}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Farm ID: FARM_001`, pageWidth / 2, 33, { align: 'center' });

    // Summary Section
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Summary', 14, 45);
    
    doc.setFontSize(10);
    const summaryData = [
      ['Total Rooms Tracked', roomReports.length.toString()],
      ['Total Recommendations', recommendations.length.toString()],
      ['Report Period', `${roomReports[0]?.daysTracked || 0} days`]
    ];
    
    // Use autoTable as a function, passing doc as first argument
    autoTable(doc, {
      startY: 50,
      head: [],
      body: summaryData,
      theme: 'plain',
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
        1: { cellWidth: 'auto' }
      }
    });

    // Room Performance Table
    let currentY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Room Performance Metrics', 14, currentY);
    
    const roomTableData = roomReports.map(report => [
      report.roomId,
      report.totalEggs.toLocaleString(),
      `${report.avgWeight} kg`,
      report.avgFCR,
      `${report.mortalityRate}%`,
      `${report.avgTemp}°C`,
      `${report.avgHumidity}%`,
      report.currentBirds.toLocaleString()
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Room', 'Total Eggs', 'Avg Weight', 'FCR', 'Mortality', 'Temp', 'Humidity', 'Birds']],
      body: roomTableData,
      theme: 'striped',
      headStyles: { fillColor: [34, 139, 34], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold' }
      }
    });

    // Recommendations Section
    if (recommendations.length > 0) {
      currentY = doc.lastAutoTable.finalY + 10;
      
      // Check if we need a new page
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.text('Recommendations & Insights', 14, currentY);
      
      const recTableData = recommendations.map(rec => [
        rec.roomId,
        rec.category,
        rec.type,
        rec.message
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [['Room', 'Category', 'Type', 'Message']],
        body: recTableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 'auto' }
        },
        didParseCell: function(data) {
          if (data.row.section === 'body' && data.column.index === 2) {
            const cellValue = data.cell.text[0];
            if (cellValue === 'warning') {
              data.cell.styles.textColor = [234, 88, 12];
            } else if (cellValue === 'success') {
              data.cell.styles.textColor = [34, 139, 34];
            }
          }
        }
      });
    }

    // AI Predictions Section
    const roomsWithAI = Object.keys(aiPredictions).filter(roomId => !aiPredictions[roomId].error);
    if (roomsWithAI.length > 0) {
      currentY = doc.lastAutoTable.finalY + 10;
      
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.text('AI-Powered Predictions', 14, currentY);
      
      const aiTableData = roomsWithAI.map(roomId => {
        const prediction = aiPredictions[roomId];
        const topFeed = prediction.recommendations?.[0];
        return [
          roomId,
          `${prediction.predicted_avg_weight_kg} kg`,
          topFeed ? topFeed.feed : 'N/A',
          topFeed ? `${topFeed.expected_avg_weight} kg` : 'N/A'
        ];
      });

      autoTable(doc, {
        startY: currentY + 5,
        head: [['Room', 'Predicted Weight', 'Best Feed', 'Expected Weight']],
        body: aiTableData,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 3 }
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
      doc.text(
        'Generated by IT Hacks 25 Dashboard',
        pageWidth - 14,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'right' }
      );
    }

    doc.save(`farm_report_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };

  const [showExportMenu, setShowExportMenu] = useState(false);

  if (loading) {
    return (
      <Layout>
        <PageContainer wide>
          <div className="flex items-center justify-center h-screen">
            <Loading />
          </div>
        </PageContainer>
      </Layout>
    );
  }

  if (roomReports.length === 0) {
    return (
      <Layout>
        <PageContainer wide>
          <Card className="p-8 text-center">
            <p className="text-gray-500 text-sm sm:text-base">No CSV data available. Please upload a file to generate reports.</p>
          </Card>
        </PageContainer>
      </Layout>
    );
  }

  const currentRanking = rankings[selectedKPI] || [];

  return (
    <Layout>
      <PageContainer wide>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">📊 Farm Performance Reports</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base leading-relaxed">
              Comprehensive analytics, rankings, and recommendations
              {dateRange && (
                <span className="ml-2 text-green-600 font-medium">
                  ({dateRange.startDate} to {dateRange.endDate})
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <RefreshButton onRefresh={() => {
              setDateRange(null);
              window.location.reload();
            }} />
            <DateRangePicker
              onApply={setDateRange}
              onClear={() => setDateRange(null)}
            />
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Download size={18} />
                Export Report
                <ChevronDown size={16} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                <button
                  onClick={exportCSV}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left rounded-t-lg"
                >
                  <FileSpreadsheet size={18} className="text-green-600" />
                  <span className="font-medium text-gray-700">Export as CSV</span>
                </button>
                <button
                  onClick={exportJSON}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
                >
                  <FileJson size={18} className="text-blue-600" />
                  <span className="font-medium text-gray-700">Export as JSON</span>
                </button>
                <button
                  onClick={exportPDF}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left rounded-b-lg border-t border-gray-100"
                >
                  <FileText size={18} className="text-red-600" />
                  <span className="font-medium text-gray-700">Export as PDF</span>
                </button>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Rankings Selector */}
        <Card className="p-6 mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={24} />
            Room Rankings
          </h2>
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedKPI('eggs')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedKPI === 'eggs' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🥚 Egg Production
            </button>
            <button
              onClick={() => setSelectedKPI('weight')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedKPI === 'weight' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⚖️ Average Weight
            </button>
            <button
              onClick={() => setSelectedKPI('fcr')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedKPI === 'fcr' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🌾 Feed Efficiency (FCR)
            </button>
            <button
              onClick={() => setSelectedKPI('mortality')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedKPI === 'mortality' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💚 Lowest Mortality
            </button>
          </div>

          {/* Ranking Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4">Rank</th>
                  <th className="text-left py-3 px-4">Room</th>
                  <th className="text-left py-3 px-4">
                    {selectedKPI === 'eggs' && 'Total Eggs'}
                    {selectedKPI === 'weight' && 'Avg Weight (kg)'}
                    {selectedKPI === 'fcr' && 'Feed Conversion Ratio'}
                    {selectedKPI === 'mortality' && 'Mortality Rate (%)'}
                  </th>
                  <th className="text-left py-3 px-4">Performance</th>
                </tr>
              </thead>
              <tbody>
                {currentRanking.map((report, index) => (
                  <tr key={report.roomId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Trophy className="text-yellow-500" size={20} />}
                        {index === 1 && <Trophy className="text-gray-400" size={18} />}
                        {index === 2 && <Trophy className="text-orange-600" size={16} />}
                        <span className="font-semibold">{index + 1}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">Room {report.roomId}</td>
                    <td className="py-3 px-4">
                      {selectedKPI === 'eggs' && report.totalEggs.toLocaleString()}
                      {selectedKPI === 'weight' && `${report.avgWeight} kg`}
                      {selectedKPI === 'fcr' && report.avgFCR}
                      {selectedKPI === 'mortality' && `${report.mortalityRate}%`}
                    </td>
                    <td className="py-3 px-4">
                      {index === 0 && (
                        <span className="flex items-center gap-1 text-green-600">
                          <TrendingUp size={16} /> Excellent
                        </span>
                      )}
                      {index > 0 && index < currentRanking.length - 1 && (
                        <span className="text-gray-600">Average</span>
                      )}
                      {index === currentRanking.length - 1 && currentRanking.length > 2 && (
                        <span className="flex items-center gap-1 text-orange-600">
                          <TrendingDown size={16} /> Needs Attention
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Per-Room Summary */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4">📋 Per-Room Summary</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {roomReports.map(report => (
              <Card key={report.roomId} className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-green-700">Room {report.roomId}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total Eggs</p>
                    <p className="font-semibold text-lg">{report.totalEggs.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Peak Production</p>
                    <p className="font-semibold text-lg">{report.peakEggs} eggs (Day {report.peakDay})</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Avg Weight</p>
                    <p className="font-semibold text-lg">{report.avgWeight} kg</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Feed Conversion</p>
                    <p className="font-semibold text-lg">{report.avgFCR}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Mortality Rate</p>
                    <p className="font-semibold text-lg">{report.mortalityRate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Current Birds</p>
                    <p className="font-semibold text-lg">{report.currentBirds.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Avg Temperature</p>
                    <p className="font-semibold text-lg">{report.avgTemp}°C</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Avg Humidity</p>
                    <p className="font-semibold text-lg">{report.avgHumidity}%</p>
                  </div>
                </div>

                {/* AI Predictions Section */}
                {aiPredictions[report.roomId] && !aiPredictions[report.roomId].error && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                      🤖 AI-Powered Insights
                    </h4>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 mb-3">
                        <span className="font-medium">Predicted Average Weight:</span> {aiPredictions[report.roomId].predicted_avg_weight_kg} kg
                      </p>
                      {aiPredictions[report.roomId].recommendations && aiPredictions[report.roomId].recommendations.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Feed Recommendations:</p>
                          <div className="space-y-2">
                            {aiPredictions[report.roomId].recommendations.slice(0, 3).map((feedRec, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-white p-2 rounded text-xs">
                                <span className="font-medium text-gray-800">{feedRec.feed}</span>
                                <span className="text-green-600">
                                  Expected: {feedRec.expected_avg_weight} kg
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            💡 Recommendations & Insights
          </h2>
          <div className="space-y-3">
            {recommendations.length === 0 && (
              <p className="text-gray-500">No specific recommendations at this time. All rooms performing well!</p>
            )}
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-green-50 border-green-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  {rec.type === 'warning' ? (
                    <AlertTriangle className="text-yellow-600 mt-1" size={20} />
                  ) : (
                    <TrendingUp className="text-green-600 mt-1" size={20} />
                  )}
                  <div>
                    <p className="font-semibold text-sm text-gray-700">{rec.category}</p>
                    <p className="text-gray-800 mt-1">{rec.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </PageContainer>
    </Layout>
  );
}

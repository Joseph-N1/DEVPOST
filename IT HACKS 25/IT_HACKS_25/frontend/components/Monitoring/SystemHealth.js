import React from 'react';

export default function SystemHealth({ data = {} }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          System Health
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No system health data available
        </div>
      </div>
    );
  }

  const memory = data.memory || {};
  const cpu = data.cpu || {};
  const database = data.database || {};
  const status = data.status || 'unknown';

  // Status color
  const statusColor = {
    healthy: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700',
    degraded: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
    critical: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700',
    unknown: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600'
  };

  const statusDot = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    critical: 'bg-red-500',
    unknown: 'bg-gray-500'
  };

  // Memory gauge
  const memoryPercent = memory.percent || 0;
  const memoryColor = memoryPercent > 85 ? 'bg-red-500' : memoryPercent > 70 ? 'bg-yellow-500' : 'bg-green-500';

  // CPU gauge
  const cpuPercent = cpu.percent || 0;
  const cpuColor = cpuPercent > 80 ? 'bg-red-500' : cpuPercent > 60 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          System Health
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold border flex items-center gap-2 ${statusColor[status] || statusColor.unknown}`}>
          <span className={`w-2 h-2 rounded-full ${statusDot[status] || statusDot.unknown}`}></span>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>

      <div className="space-y-6">
        {/* Memory */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Memory Usage</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {memory.used_gb?.toFixed(1)}GB / {memory.total_gb?.toFixed(1)}GB ({memoryPercent.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full ${memoryColor} transition-all duration-300`}
              style={{ width: `${Math.min(memoryPercent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* CPU */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CPU Usage</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {cpuPercent.toFixed(1)}% ({cpu.count_logical} cores)
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full ${cpuColor} transition-all duration-300`}
              style={{ width: `${Math.min(cpuPercent, 100)}%` }}
            ></div>
          </div>
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            Load avg: {cpu.load_average_1?.toFixed(2)} / {cpu.load_average_5?.toFixed(2)} / {cpu.load_average_15?.toFixed(2)}
          </div>
        </div>

        {/* Database Stats */}
        {database && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Database</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400">Farms</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{database.farms || 0}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400">Rooms</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{database.rooms || 0}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400">Metrics</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {(database.metrics || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Timestamp */}
        {data.timestamp && (
          <div className="text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
            Last updated: {new Date(data.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}

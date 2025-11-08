import React from 'react';
import { FileSpreadsheet } from 'lucide-react';

const AnalyticsEmptyState = ({ message = "No data available", onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border border-gray-100">
      <div className="bg-gray-50 p-4 rounded-full mb-4">
        <FileSpreadsheet className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-gray-600 text-center mb-4">{message}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Upload Data
        </button>
      )}
    </div>
  );
};

export default AnalyticsEmptyState;
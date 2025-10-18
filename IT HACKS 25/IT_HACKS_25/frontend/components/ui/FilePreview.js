import React from 'react';
import Card from './Card';
import InfoBadge from './InfoBadge';
import Loader from './Loader';

const FilePreview = ({ preview, loading, error }) => {
  if (loading) return <Loader />;
  if (error) return <div className="text-red-500">Error loading preview: {error}</div>;
  if (!preview) return null;

  const getDataTypeColor = (dtype) => {
    const typeColors = {
      'int': 'blue',
      'float': 'green',
      'object': 'purple',
      'datetime': 'yellow',
      'bool': 'red'
    };
    return typeColors[dtype.toLowerCase()] || 'gray';
  };

  return (
    <Card className="mt-4">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {preview.filename}
          </h2>
          <div className="flex space-x-2">
            <InfoBadge
              label="Total Rows"
              value={preview.total_rows.toLocaleString()}
              color="blue"
            />
            <InfoBadge
              label="Columns"
              value={preview.total_columns}
              color="purple"
            />
          </div>
        </div>

        {/* Column Types */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Column Types:</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(preview.dtypes).map(([col, dtype]) => (
              <InfoBadge
                key={col}
                label={col}
                value={dtype}
                color={getDataTypeColor(dtype)}
              />
            ))}
          </div>
        </div>

        {/* Data Preview */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                {preview.columns.map((col) => (
                  <th
                    key={col}
                    className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {preview.preview_rows.map((row, idx) => (
                <tr key={idx}>
                  {preview.columns.map((col) => (
                    <td
                      key={col}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {row[col]?.toString()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

export default FilePreview;
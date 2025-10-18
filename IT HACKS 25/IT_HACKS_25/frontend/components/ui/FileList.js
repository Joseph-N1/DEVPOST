import React from 'react';
import { format } from 'date-fns';
import Card from './Card';
import InfoBadge from './InfoBadge';
import Button from './Button';
import Loader from './Loader';

const FileList = ({ files, onFileSelect, loading, error }) => {
  if (loading) return <Loader />;
  if (error) return <div className="text-red-500">Error loading files: {error}</div>;
  if (!files?.length) return <div className="text-gray-500">No files available</div>;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-4">
      {files.map((file) => (
        <Card key={file.path} className="hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between p-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">{file.filename}</h3>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                <InfoBadge
                  label="Type"
                  value={file.type === 'sample' ? 'Sample Data' : 'User Data'}
                  color={file.type === 'sample' ? 'blue' : 'green'}
                />
                <InfoBadge
                  label="Size"
                  value={formatFileSize(file.size)}
                  color="gray"
                />
                <InfoBadge
                  label="Modified"
                  value={format(new Date(file.modified * 1000), 'PP')}
                  color="purple"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => onFileSelect(file)}
                variant="primary"
                size="sm"
              >
                Preview
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default FileList;
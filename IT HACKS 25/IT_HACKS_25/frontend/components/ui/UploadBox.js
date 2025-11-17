import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function UploadBox({ onFileSelect }) {
  const { t } = useTranslation();
  const [selectedFileName, setSelectedFileName] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      if (onFileSelect) {
        onFileSelect(file);
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl shadow-md border border-green-100 hover:shadow-lg transition-all duration-300">
      <h2 className="text-xl font-semibold text-green-700 mb-4">{t("upload_csv") || "Select CSV File"}</h2>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="w-full border border-green-300 p-3 rounded-lg focus:ring-2 focus:ring-green-400 focus:outline-none text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
          />
          {selectedFileName && (
            <p className="text-sm text-gray-600 mt-2">
              📄 Selected: <span className="font-medium">{selectedFileName}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

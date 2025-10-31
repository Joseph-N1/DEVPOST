import { useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

export default function UploadBox() {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return setMessage(t("select_csv") || "Please select a CSV file first.");
    const form = new FormData();
    form.append("file", file);

    try {
      setLoading(true);
      // DO NOT set Content-Type manually — let the browser set the multipart boundary
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/upload/csv`,
        form
      );
      setMessage(t("upload_success") || "File uploaded successfully!");
    } catch (err) {
      // show server error if available
      const detail = err.response?.data?.detail || err.message;
      setMessage((t("upload_error") || "Upload failed. Please try again.") + " — " + detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-md border border-green-100 hover:shadow-lg transition-all duration-300">
      <h2 className="text-xl font-semibold text-green-700 mb-4">{t("upload_csv") || "Upload CSV"}</h2>

      <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          className="flex-1 border border-green-300 p-2 rounded-lg focus:ring-2 focus:ring-green-400 focus:outline-none"
        />
        <button
          onClick={handleUpload}
          disabled={loading}
          className={`px-5 py-2 rounded-lg text-white font-medium transition ${
            loading ? "bg-green-300" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? t("uploading") || "Uploading..." : t("upload") || "Upload"}
        </button>
      </div>

      {message && <p className="text-sm text-gray-700 mt-2">{message}</p>}
    </div>
  );
}

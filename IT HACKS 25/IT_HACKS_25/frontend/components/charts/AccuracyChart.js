import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function AccuracyChart({ dataPoints }) {
  const data = {
    labels: dataPoints.map((_, i) => `Epoch ${i + 1}`),
    datasets: [
      {
        label: "Model Accuracy",
        data: dataPoints,
        borderColor: "rgb(37, 99, 235)",
        backgroundColor: "rgba(37, 99, 235, 0.5)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Training Accuracy Over Time" },
    },
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl p-4">
      <Line data={data} options={options} />
    </div>
  );
}

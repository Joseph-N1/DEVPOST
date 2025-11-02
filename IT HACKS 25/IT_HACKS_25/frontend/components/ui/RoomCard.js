import React from "react";
import TrendIndicator from "./TrendIndicator";

/**
 * RoomCard displays summary stats for a specific poultry room
 * Example props:
 * title="Room A"
 * birds={1000}
 * avgWeight="2.4 kg"
 * mortality="0.5%"
 * eggsCollected={320}
 * trend={+8}
 */
export default function RoomCard({
  title,
  birds,
  avgWeight,
  mortality,
  eggsCollected,
  trend,
}) {
  return (
    <div className="bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg rounded-2xl p-5 border border-green-100 transition-transform hover:-translate-y-1 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-green-700">{title}</h3>
        <TrendIndicator value={trend} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
        <div>
          <p className="font-semibold text-gray-800">Birds</p>
          <p>{birds.toLocaleString()}</p>
        </div>
        <div>
          <p className="font-semibold text-gray-800">Avg Weight</p>
          <p>{avgWeight}</p>
        </div>
        <div>
          <p className="font-semibold text-gray-800">Mortality</p>
          <p>{mortality}</p>
        </div>
        <div>
          <p className="font-semibold text-gray-800">Eggs</p>
          <p>{eggsCollected}</p>
        </div>
      </div>
    </div>
  );
}

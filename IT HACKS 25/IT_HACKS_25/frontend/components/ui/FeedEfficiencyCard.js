import React from "react";
import TrendIndicator from "./TrendIndicator";

/**
 * FeedEfficiencyCard shows feed usage, conversion, and cost efficiency.
 * Example props:
 * feedType="Starter Feed"
 * fcr={1.78}
 * costPerBird="$2.15"
 * trend={+5}
 */
export default function FeedEfficiencyCard({ feedType, fcr, costPerBird, trend }) {
  return (
    <div className="bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-transform hover:-translate-y-1 duration-300">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-green-700">{feedType}</h3>
        <TrendIndicator value={trend} />
      </div>

      <div className="space-y-1 text-sm text-gray-700">
        <p>
          <span className="font-semibold text-gray-800">Feed Conversion Ratio:</span>{" "}
          {fcr}
        </p>
        <p>
          <span className="font-semibold text-gray-800">Cost per Bird:</span>{" "}
          {costPerBird}
        </p>
      </div>
    </div>
  );
}

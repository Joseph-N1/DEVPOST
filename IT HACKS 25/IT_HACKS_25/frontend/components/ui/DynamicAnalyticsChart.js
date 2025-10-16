"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const AnalyticsChart = dynamic(() => import("./AnalyticsChart"), {
  ssr: false,
});

export default function DynamicAnalyticsChart(props) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Optional: small skeleton or empty div to avoid hydration mismatch
    return (
      <div className="flex justify-center items-center p-10 text-green-600">
        <p className="animate-pulse text-lg font-medium">Loading chart...</p>
      </div>
    );
  }

  return <AnalyticsChart {...props} />;
}

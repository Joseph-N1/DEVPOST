import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

/**
 * TrendIndicator
 * 
 * A reusable component to show upward or downward trends with color-coded arrows.
 * 
 * Props:
 * - value (number): the trend percentage (can be positive or negative)
 * - size (string): one of "sm" | "md" | "lg" (optional, default "md")
 * - showPercent (boolean): if true, displays the percentage value next to the arrow
 * 
 * Example:
 * <TrendIndicator value={+5} />
 * <TrendIndicator value={-2} size="sm" />
 * <TrendIndicator value={+12} showPercent />
 */
export default function TrendIndicator({ value = 0, size = "md", showPercent = true }) {
  const isPositive = value >= 0;

  // choose size classes dynamically
  const sizeClasses = {
    sm: "w-3 h-3 text-xs",
    md: "w-4 h-4 text-sm",
    lg: "w-5 h-5 text-base",
  };

  return (
    <div
      className={`flex items-center font-medium ${
        isPositive ? "text-green-600" : "text-red-500"
      }`}
    >
      {isPositive ? (
        <ArrowUpRight className={sizeClasses[size]} />
      ) : (
        <ArrowDownRight className={sizeClasses[size]} />
      )}
      {showPercent && (
        <span className={`ml-1 ${size === "sm" ? "text-xs" : "text-sm"}`}>
          {Math.abs(value)}%
        </span>
      )}
    </div>
  );
}

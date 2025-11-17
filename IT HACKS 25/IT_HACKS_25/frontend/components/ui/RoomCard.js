import React, { useState } from "react";
import Link from "next/link";
import TrendIndicator from "./TrendIndicator";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";

/**
 * RoomCard displays summary stats for a specific poultry room
 * Example props:
 * id="R001"
 * title="Room A"
 * birds={1000}
 * avgWeight="2.4 kg"
 * mortality="0.5%"
 * eggsCollected={320}
 * trend={+8}
 */
export default function RoomCard({
  id,
  title,
  birds,
  avgWeight,
  mortality,
  eggsCollected,
  trend,
}) {
  const { t } = useTranslation();
  const [activeTooltip, setActiveTooltip] = useState(null);
  const tooltips = {
    birds: t('metrics.total_birds_tooltip', 'Current number of birds in the room'),
    weight: t('metrics.avg_weight_tooltip', 'Average weight of birds in the room'),
    mortality: t('metrics.mortality_tooltip', 'Mortality rate in the last 24 hours'),
    eggs: t('metrics.eggs_tooltip', 'Total eggs collected today')
  };

  const Tooltip = ({ content, visible }) => (
    <div className={`
      absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2
      bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap
      transition-opacity duration-200
      ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
    `}>
      {content}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800" />
    </div>
  );

  return (
    <Link href={`/rooms/${id}`} className="block h-full">
      <div className="flex flex-col justify-between h-full relative bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg rounded-2xl p-4 sm:p-5 border border-green-100 transition-all duration-300 hover:-translate-y-1 hover:bg-white/90 hover:scale-[1.02]">
        {/* Header */}
        <header className="flex items-center justify-between mb-3">
          <h3 className="text-base sm:text-lg font-semibold text-green-700 truncate">{title}</h3>
          <TrendIndicator value={trend} />
        </header>

        {/* Stats */}
        <div className="flex-1 grid grid-cols-2 gap-3 text-sm text-gray-700">
          <div className="relative group">
            <div className="flex items-center">
              <p className="font-semibold text-gray-800">Birds</p>
              <button
                className="ml-1 text-gray-400 hover:text-gray-600"
                onMouseEnter={() => setActiveTooltip('birds')}
                onMouseLeave={() => setActiveTooltip(null)}
              >
                <Info size={14} />
              </button>
            </div>
            <p>{birds.toLocaleString()}</p>
            <Tooltip content={tooltips.birds} visible={activeTooltip === 'birds'} />
          </div>
          <div className="relative group">
            <div className="flex items-center">
              <p className="font-semibold text-gray-800">Avg Weight</p>
              <button
                className="ml-1 text-gray-400 hover:text-gray-600"
                onMouseEnter={() => setActiveTooltip('weight')}
                onMouseLeave={() => setActiveTooltip(null)}
              >
                <Info size={14} />
              </button>
            </div>
            <p>{avgWeight}</p>
            <Tooltip content={tooltips.weight} visible={activeTooltip === 'weight'} />
          </div>
          <div className="relative group">
            <div className="flex items-center">
              <p className="font-semibold text-gray-800">Mortality</p>
              <button
                className="ml-1 text-gray-400 hover:text-gray-600"
                onMouseEnter={() => setActiveTooltip('mortality')}
                onMouseLeave={() => setActiveTooltip(null)}
              >
                <Info size={14} />
              </button>
            </div>
            <p>{mortality}</p>
            <Tooltip content={tooltips.mortality} visible={activeTooltip === 'mortality'} />
          </div>
          <div className="relative group">
            <div className="flex items-center">
              <p className="font-semibold text-gray-800">Eggs</p>
              <button
                className="ml-1 text-gray-400 hover:text-gray-600"
                onMouseEnter={() => setActiveTooltip('eggs')}
                onMouseLeave={() => setActiveTooltip(null)}
              >
                <Info size={14} />
              </button>
            </div>
            <p>{eggsCollected}</p>
            <Tooltip content={tooltips.eggs} visible={activeTooltip === 'eggs'} />
          </div>
        </div>
      </div>
    </Link>
  );
}

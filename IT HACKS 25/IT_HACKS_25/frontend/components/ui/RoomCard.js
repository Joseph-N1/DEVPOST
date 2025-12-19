import React, { useState, useRef, useEffect } from "react";
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
  const tooltipRefs = useRef({});
  
  const tooltips = {
    birds: t('metrics.total_birds_tooltip', 'Current number of birds in the room'),
    weight: t('metrics.avg_weight_tooltip', 'Average weight of birds in the room'),
    mortality: t('metrics.mortality_tooltip', 'Mortality rate in the last 24 hours'),
    eggs: t('metrics.eggs_tooltip', 'Total eggs collected today')
  };

  // Handle keyboard escape to close tooltip
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeTooltip) {
        setActiveTooltip(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTooltip]);

  // Accessible tooltip component with proper ARIA attributes
  const Tooltip = ({ id, content, visible }) => (
    <div 
      id={`tooltip-${id}`}
      role="tooltip"
      aria-hidden={!visible}
      className={`
        absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2
        bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap
        transition-opacity duration-200 z-10
        ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
    >
      {content}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800" aria-hidden="true" />
    </div>
  );

  // Accessible info button with keyboard support
  const InfoButton = ({ tooltipKey }) => (
    <button
      type="button"
      className="ml-1 text-gray-400 hover:text-gray-600 focus:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 rounded"
      onMouseEnter={() => setActiveTooltip(tooltipKey)}
      onMouseLeave={() => setActiveTooltip(null)}
      onFocus={() => setActiveTooltip(tooltipKey)}
      onBlur={() => setActiveTooltip(null)}
      aria-describedby={`tooltip-${tooltipKey}`}
      aria-label={`${tooltipKey} information`}
    >
      <Info size={14} aria-hidden="true" />
    </button>
  );

  return (
    <Link href={`/rooms/${id}`} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 rounded-2xl">
      <article 
        className="flex flex-col justify-between h-full relative card-base card-interactive bg-white/80 backdrop-blur-sm p-4 sm:p-5 border-green-100"
        aria-label={t('room.card_label', { title, birds }, `${title} - ${birds} birds`)}
      >
        {/* Header */}
        <header className="flex items-center justify-between mb-3">
          <h3 className="text-base sm:text-lg font-semibold text-green-700 truncate">{title}</h3>
          <TrendIndicator value={trend} />
        </header>

        {/* Stats */}
        <div className="flex-1 grid grid-cols-2 gap-3 text-sm text-gray-700" role="list" aria-label={t('room.stats', 'Room statistics')}>
          <div className="relative" role="listitem">
            <div className="flex items-center">
              <p className="font-semibold text-gray-800">{t('metrics.birds', 'Birds')}</p>
              <InfoButton tooltipKey="birds" />
            </div>
            <p aria-label={t('metrics.bird_count', { count: birds }, `${birds} birds`)}>{birds.toLocaleString()}</p>
            <Tooltip id="birds" content={tooltips.birds} visible={activeTooltip === 'birds'} />
          </div>
          <div className="relative" role="listitem">
            <div className="flex items-center">
              <p className="font-semibold text-gray-800">{t('metrics.avg_weight', 'Avg Weight')}</p>
              <InfoButton tooltipKey="weight" />
            </div>
            <p>{avgWeight}</p>
            <Tooltip id="weight" content={tooltips.weight} visible={activeTooltip === 'weight'} />
          </div>
          <div className="relative" role="listitem">
            <div className="flex items-center">
              <p className="font-semibold text-gray-800">{t('metrics.mortality', 'Mortality')}</p>
              <InfoButton tooltipKey="mortality" />
            </div>
            <p>{mortality}</p>
            <Tooltip id="mortality" content={tooltips.mortality} visible={activeTooltip === 'mortality'} />
          </div>
          <div className="relative" role="listitem">
            <div className="flex items-center">
              <p className="font-semibold text-gray-800">{t('metrics.eggs', 'Eggs')}</p>
              <InfoButton tooltipKey="eggs" />
            </div>
            <p>{eggsCollected}</p>
            <Tooltip id="eggs" content={tooltips.eggs} visible={activeTooltip === 'eggs'} />
          </div>
        </div>
      </article>
    </Link>
  );
}


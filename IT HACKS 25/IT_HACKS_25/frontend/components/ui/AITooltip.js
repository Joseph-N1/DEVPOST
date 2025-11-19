import React, { useState, useEffect } from 'react';
import { Info, HelpCircle } from 'lucide-react';
import { getMetricExplanation } from '@/utils/api';

export default function AITooltip({ metric, value, change = 0, roomId = null }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchExplanation = async () => {
    if (explanation) return; // Already loaded
    
    setLoading(true);
    try {
      const result = await getMetricExplanation(metric, value, change, roomId);
      setExplanation(result);
    } catch (error) {
      console.error('Failed to fetch metric explanation:', error);
      setExplanation({
        metric: metric.replace('_', ' ').toUpperCase(),
        meaning: 'AI explanation temporarily unavailable',
        explanation: `Current value: ${value}`,
        recommended_action: 'Monitor trends and consult documentation'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = () => {
    setShowTooltip(true);
    fetchExplanation();
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <div className="relative inline-block">
      {/* Tooltip Trigger Icon */}
      <button
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="ml-1.5 text-gray-400 hover:text-blue-600 transition-colors focus:outline-none"
        aria-label="AI Explanation"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {/* Tooltip Content */}
      {showTooltip && (
        <div 
          className="absolute z-50 w-80 p-4 bg-white rounded-lg shadow-2xl border-2 border-blue-500 left-0 top-full mt-2"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={handleMouseLeave}
        >
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Loading AI explanation...</span>
            </div>
          ) : explanation ? (
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <Info className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-gray-900">{explanation.metric}</h4>
              </div>

              {/* Current Value */}
              <div className="bg-blue-50 px-3 py-2 rounded-md">
                <span className="text-sm font-semibold text-blue-900">
                  Current Value: {explanation.current_value}
                  {explanation.change_percent !== 0 && (
                    <span className={`ml-2 ${explanation.change_percent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ({explanation.change_percent > 0 ? '+' : ''}{explanation.change_percent}%)
                    </span>
                  )}
                </span>
              </div>

              {/* Meaning */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">What this means:</p>
                <p className="text-sm text-gray-600 leading-relaxed">{explanation.meaning}</p>
              </div>

              {/* Explanation */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">Why it changed:</p>
                <p className="text-sm text-gray-600 leading-relaxed">{explanation.explanation}</p>
              </div>

              {/* Recommended Action */}
              <div className="bg-green-50 px-3 py-2 rounded-md border border-green-200">
                <p className="text-xs font-semibold text-green-800 mb-1">What to do next:</p>
                <p className="text-sm text-green-700 leading-relaxed">{explanation.recommended_action}</p>
              </div>

              {/* AI Badge */}
              <div className="text-center pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500 italic">🤖 AI-Powered Explanation</span>
              </div>
            </div>
          ) : null}

          {/* Tooltip Arrow */}
          <div className="absolute -top-2 left-4 w-4 h-4 bg-white border-t-2 border-l-2 border-blue-500 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
}

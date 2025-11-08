import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoveHorizontal, MoveVertical, ArrowLeftRight, X } from 'lucide-react';

export default function ComparisonView({
  title,
  subtitle,
  leftContent,
  rightContent,
  leftTitle,
  rightTitle,
  onClose,
  orientation = 'horizontal',
  onOrientationChange,
  className = ''
}) {
  const { t } = useTranslation();
  const [splitRatio, setSplitRatio] = useState(50);

  const handleSplitDrag = (e) => {
    const container = e.currentTarget.parentElement;
    const rect = container.getBoundingClientRect();
    const position = orientation === 'horizontal' 
      ? e.clientX - rect.left 
      : e.clientY - rect.top;
    const totalSize = orientation === 'horizontal' ? rect.width : rect.height;
    const newRatio = Math.min(Math.max((position / totalSize) * 100, 20), 80);
    setSplitRatio(newRatio);
  };

  return (
    <div className={`comparison-container ${className} ${orientation === 'horizontal' ? 'flex-row' : 'flex-col'}`}>
      {/* Header */}
      <div className="comparison-header">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOrientationChange(orientation === 'horizontal' ? 'vertical' : 'horizontal')}
            className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
            title={t('comparison.changeOrientation', 'Change Layout')}
          >
            {orientation === 'horizontal' ? <MoveHorizontal className="w-4 h-4" /> : <MoveVertical className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
            title={t('comparison.close', 'Close Comparison')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className={`comparison-content-container ${orientation === 'horizontal' ? 'flex-row' : 'flex-col'}`}>
        {/* Left Content */}
        <div 
          className="comparison-panel"
          style={{ 
            flex: `0 0 ${splitRatio}%`
          }}
        >
          <div className="comparison-panel-header">
            <h4 className="text-lg font-medium text-gray-700">{leftTitle}</h4>
          </div>
          <div className="comparison-panel-content">
            {leftContent}
          </div>
        </div>

        {/* Splitter */}
        <div 
          className={`comparison-splitter ${orientation === 'horizontal' ? 'splitter-vertical' : 'splitter-horizontal'}`}
          onMouseDown={(e) => {
            document.addEventListener('mousemove', handleSplitDrag);
            document.addEventListener('mouseup', () => {
              document.removeEventListener('mousemove', handleSplitDrag);
            }, { once: true });
          }}
        >
          <ArrowLeftRight className="w-4 h-4" />
        </div>

        {/* Right Content */}
        <div 
          className="comparison-panel"
          style={{ 
            flex: `0 0 ${100 - splitRatio}%`
          }}
        >
          <div className="comparison-panel-header">
            <h4 className="text-lg font-medium text-gray-700">{rightTitle}</h4>
          </div>
          <div className="comparison-panel-content">
            {rightContent}
          </div>
        </div>
      </div>
    </div>
  );
}
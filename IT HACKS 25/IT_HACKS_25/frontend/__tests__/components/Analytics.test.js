"""Tests for analytics components."""

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  TrendAnalysis,
  AnomalyStats,
  PerformanceMetrics,
  CorrelationMatrix,
  TimeSeriesForecast,
  ExportReport
} from '../components/Analytics';

describe('Analytics Components', () => {
  describe('TrendAnalysis', () => {
    it('renders without data', () => {
      render(<TrendAnalysis data={{ metrics: {} }} />);
      expect(screen.getByText(/Trend Analysis/i)).toBeInTheDocument();
    });

    it('renders with metric trends', () => {
      const data = {
        metrics: {
          'temperature_c': {
            direction: 'increasing',
            slope: 0.05,
            r_squared: 0.92
          }
        }
      };
      
      render(<TrendAnalysis data={data} />);
      expect(screen.getByText(/temperature/i)).toBeInTheDocument();
      expect(screen.getByText(/increasing/i)).toBeInTheDocument();
    });
  });

  describe('AnomalyStats', () => {
    it('renders anomaly statistics', () => {
      const data = {
        statistics: {
          total_count: 45,
          frequency: 'high',
          average_score: 0.75,
          by_severity: { high: 10, medium: 15, low: 20 },
          top_metric: 'temperature_c'
        }
      };

      render(<AnomalyStats data={data} />);
      expect(screen.getByText(/45/)).toBeInTheDocument();
      expect(screen.getByText(/Anomaly Statistics/i)).toBeInTheDocument();
    });
  });

  describe('PerformanceMetrics', () => {
    it('renders performance metrics', () => {
      const data = {
        metrics: {
          mae: 0.45,
          rmse: 0.67,
          r_squared: 0.88,
          success_rate: 98.5
        }
      };

      render(<PerformanceMetrics data={data} />);
      expect(screen.getByText(/Performance Metrics/i)).toBeInTheDocument();
      expect(screen.getByText(/MAE/)).toBeInTheDocument();
    });
  });

  describe('CorrelationMatrix', () => {
    it('renders correlations', () => {
      const data = {
        correlations: {
          pairs: [
            {
              metric1: 'temperature_c',
              metric2: 'humidity_pct',
              correlation: 0.82
            }
          ]
        }
      };

      render(<CorrelationMatrix data={data} />);
      expect(screen.getByText(/Metric Correlations/i)).toBeInTheDocument();
    });
  });

  describe('TimeSeriesForecast', () => {
    it('renders forecast chart', () => {
      const data = {
        metric_name: 'temperature_c',
        forecast: {
          forecast: [25.5, 25.8, 26.0],
          confidence_interval: {
            lower: [24.5, 24.8, 25.0],
            upper: [26.5, 26.8, 27.0]
          },
          method: 'exponential_smoothing'
        }
      };

      render(<TimeSeriesForecast data={data} />);
      expect(screen.getByText(/Forecast/i)).toBeInTheDocument();
    });
  });

  describe('ExportReport', () => {
    it('renders export buttons', () => {
      render(
        <ExportReport
          farmId={1}
          roomId={null}
          days={30}
          onRefresh={() => {}}
        />
      );
      
      expect(screen.getByText(/CSV/i)).toBeInTheDocument();
      expect(screen.getByText(/JSON/i)).toBeInTheDocument();
      expect(screen.getByText(/PDF/i)).toBeInTheDocument();
    });
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrainingMetrics from '../../../components/Monitoring/TrainingMetrics';
import ModelComparison from '../../../components/Monitoring/ModelComparison';
import SystemHealth from '../../../components/Monitoring/SystemHealth';
import PredictionStats from '../../../components/Monitoring/PredictionStats';

// Mock recharts
jest.mock('recharts', () => {
  const React = require('react');
  return {
    LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
    BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
    AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
    PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
    Line: null,
    Bar: null,
    Area: null,
    Pie: null,
    Cell: null,
    XAxis: null,
    YAxis: null,
    CartesianGrid: null,
    Tooltip: null,
    Legend: null,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  };
});

describe('TrainingMetrics Component', () => {
  it('renders without data', () => {
    render(<TrainingMetrics data={[]} />);
    expect(screen.getByText(/No training data available/i)).toBeInTheDocument();
  });

  it('renders with training data', () => {
    const data = [
      {
        version: 'v1.0',
        metrics: { mae: 0.25, rmse: 0.35, r2: 0.95, performance_score: 95 }
      }
    ];

    render(<TrainingMetrics data={data} />);
    expect(screen.getByText('Training History')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('displays metric summaries', () => {
    const data = [
      {
        version: 'v1.0',
        metrics: { mae: 0.25, rmse: 0.35, r2: 0.95 }
      }
    ];

    render(<TrainingMetrics data={data} />);
    expect(screen.getByText(/Latest MAE/i)).toBeInTheDocument();
    expect(screen.getByText(/Latest RMSE/i)).toBeInTheDocument();
    expect(screen.getByText(/Latest R²/i)).toBeInTheDocument();
  });

  it('formats R² as percentage', () => {
    const data = [
      {
        version: 'v1.0',
        metrics: { mae: 0.25, rmse: 0.35, r2: 0.95 }
      }
    ];

    render(<TrainingMetrics data={data} />);
    expect(screen.getByText(/95.0%/)).toBeInTheDocument();
  });
});

describe('ModelComparison Component', () => {
  it('renders without data', () => {
    render(<ModelComparison data={{}} />);
    expect(screen.getByText(/No models available/i)).toBeInTheDocument();
  });

  it('renders with model data', () => {
    const data = {
      models: [
        {
          rank: 1,
          version: 'v1.0',
          type: 'random_forest',
          is_active: true,
          metrics: { mae: 0.25, rmse: 0.35, r2: 0.95 }
        }
      ]
    };

    render(<ModelComparison data={data} />);
    expect(screen.getByText('Model Comparison')).toBeInTheDocument();
    expect(screen.getByText(/Ranked Models/i)).toBeInTheDocument();
  });

  it('displays active model badge', () => {
    const data = {
      models: [
        {
          rank: 1,
          version: 'v1.0',
          type: 'random_forest',
          is_active: true,
          metrics: { mae: 0.25, rmse: 0.35, r2: 0.95 }
        }
      ]
    };

    render(<ModelComparison data={data} />);
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('formats model type names', () => {
    const data = {
      models: [
        {
          rank: 1,
          version: 'v1.0',
          type: 'random_forest',
          is_active: false,
          metrics: { mae: 0.25, rmse: 0.35, r2: 0.95 }
        }
      ]
    };

    render(<ModelComparison data={data} />);
    expect(screen.getByText(/random forest/i)).toBeInTheDocument();
  });
});

describe('SystemHealth Component', () => {
  it('renders without data', () => {
    render(<SystemHealth data={{}} />);
    expect(screen.getByText(/No system health data/i)).toBeInTheDocument();
  });

  it('renders with health data', () => {
    const data = {
      status: 'healthy',
      memory: { used_gb: 1.5, total_gb: 8, percent: 18.75 },
      cpu: { percent: 35, count_logical: 4, load_average_1: 0.5, load_average_5: 0.6, load_average_15: 0.4 },
      database: { farms: 2, rooms: 10, metrics: 1000 },
      timestamp: new Date().toISOString()
    };

    render(<SystemHealth data={data} />);
    expect(screen.getByText(/System Health/i)).toBeInTheDocument();
    expect(screen.getByText(/healthy/i)).toBeInTheDocument();
  });

  it('displays memory gauge', () => {
    const data = {
      status: 'healthy',
      memory: { used_gb: 1.5, total_gb: 8, percent: 18.75 },
      cpu: { percent: 35, count_logical: 4 }
    };

    render(<SystemHealth data={data} />);
    expect(screen.getByText(/Memory Usage/i)).toBeInTheDocument();
    expect(screen.getByText(/1.5GB \/ 8GB/)).toBeInTheDocument();
  });

  it('displays database stats', () => {
    const data = {
      status: 'healthy',
      database: { farms: 2, rooms: 10, metrics: 1000 }
    };

    render(<SystemHealth data={data} />);
    expect(screen.getByText('Farms')).toBeInTheDocument();
    expect(screen.getByText('Rooms')).toBeInTheDocument();
    expect(screen.getByText('Metrics')).toBeInTheDocument();
  });

  it('shows correct status color for different statuses', () => {
    const statuses = ['healthy', 'degraded', 'critical'];

    statuses.forEach(status => {
      const data = {
        status: status,
        memory: { percent: 50 }
      };

      const { rerender } = render(<SystemHealth data={data} />);
      expect(screen.getByText(status.charAt(0).toUpperCase() + status.slice(1))).toBeInTheDocument();
      rerender(<SystemHealth data={{}} />);
    });
  });
});

describe('PredictionStats Component', () => {
  it('renders without data', () => {
    render(<PredictionStats data={{}} />);
    expect(screen.getByText(/No prediction data/i)).toBeInTheDocument();
  });

  it('renders with prediction data', () => {
    const data = {
      total_predictions: 1000,
      success_rate: 99.5,
      avg_latency_ms: 245,
      p95_latency_ms: 892,
      by_endpoint: {
        eggs: { count: 200, success_rate: 99.5, avg_latency: 250 },
        weight: { count: 200, success_rate: 99.5, avg_latency: 240 },
        mortality: { count: 200, success_rate: 99.5, avg_latency: 245 }
      }
    };

    render(<PredictionStats data={data} />);
    expect(screen.getByText('Prediction Statistics')).toBeInTheDocument();
    expect(screen.getByText(/Total Predictions/i)).toBeInTheDocument();
  });

  it('displays top metrics', () => {
    const data = {
      total_predictions: 1000,
      success_rate: 99.5,
      avg_latency_ms: 245,
      p95_latency_ms: 892,
      by_endpoint: {}
    };

    render(<PredictionStats data={data} />);
    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('99.5%')).toBeInTheDocument();
  });

  it('displays endpoint breakdown', () => {
    const data = {
      total_predictions: 600,
      success_rate: 99.5,
      by_endpoint: {
        eggs: { count: 200, success_rate: 99.5, avg_latency: 250 },
        weight: { count: 200, success_rate: 99.5, avg_latency: 240 },
        mortality: { count: 200, success_rate: 99.5, avg_latency: 245 }
      }
    };

    render(<PredictionStats data={data} />);
    expect(screen.getByText(/By Endpoint/i)).toBeInTheDocument();
    expect(screen.getByText(/Eggs/i)).toBeInTheDocument();
    expect(screen.getByText(/Weight/i)).toBeInTheDocument();
  });

  it('formats numbers with thousand separators', () => {
    const data = {
      total_predictions: 10000,
      success_rate: 99.5,
      by_endpoint: {}
    };

    render(<PredictionStats data={data} />);
    expect(screen.getByText('10,000')).toBeInTheDocument();
  });

  it('renders pie chart when endpoints available', () => {
    const data = {
      total_predictions: 600,
      success_rate: 99.5,
      by_endpoint: {
        eggs: { count: 200, success_rate: 99.5, avg_latency: 250 },
        weight: { count: 200, success_rate: 99.5, avg_latency: 240 }
      }
    };

    render(<PredictionStats data={data} />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });
});

describe('Component Integration', () => {
  it('all components handle null data gracefully', () => {
    expect(() => {
      render(<TrainingMetrics data={null} />);
    }).not.toThrow();

    expect(() => {
      render(<ModelComparison data={null} />);
    }).not.toThrow();

    expect(() => {
      render(<SystemHealth data={null} />);
    }).not.toThrow();

    expect(() => {
      render(<PredictionStats data={null} />);
    }).not.toThrow();
  });

  it('all components render with undefined data', () => {
    render(<TrainingMetrics data={undefined} />);
    expect(screen.getByText(/Training History/i)).toBeInTheDocument();

    const { unmount } = render(<ModelComparison data={undefined} />);
    unmount();

    render(<SystemHealth data={undefined} />);
    expect(screen.getByText(/System Health/i)).toBeInTheDocument();

    const { unmount: unmount2 } = render(<PredictionStats data={undefined} />);
    unmount2();
  });
});

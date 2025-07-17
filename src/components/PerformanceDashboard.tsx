import React, { useState, useEffect } from 'react';
import { LazyLoadingService } from '../services/lazyLoadingService';
import { BundleAnalyzer } from '../utils/bundleAnalyzer';
import './PerformanceDashboard.css';

interface PerformanceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ isOpen, onClose }) => {
  const [componentStats, setComponentStats] = useState<any>({});
  const [bundleStats, setBundleStats] = useState<any>({});
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      refreshStats();
    }
  }, [isOpen]);

  const refreshStats = () => {
    setIsRefreshing(true);
    
    // Get component statistics
    const stats = LazyLoadingService.getAllComponentStats();
    setComponentStats(stats);
    
    // Get bundle statistics
    const bundle = BundleAnalyzer.getBundleStats();
    setBundleStats(bundle);
    
    // Generate recommendations
    const report = LazyLoadingService.generateReport();
    setRecommendations(report.recommendations || []);
    
    setIsRefreshing(false);
  };

  const clearStats = () => {
    LazyLoadingService.clear();
    BundleAnalyzer.clear();
    refreshStats();
  };

  if (!isOpen) return null;

  return (
    <div className="performance-dashboard-overlay">
      <div className="performance-dashboard">
        <div className="dashboard-header">
          <h2>📊 Performance Dashboard</h2>
          <div className="dashboard-actions">
            <button 
              className="btn btn-secondary"
              onClick={refreshStats}
              disabled={isRefreshing}
            >
              {isRefreshing ? '🔄' : '🔄'} Refresh
            </button>
            <button 
              className="btn btn-danger"
              onClick={clearStats}
            >
              🗑️ Clear Stats
            </button>
            <button 
              className="btn btn-primary"
              onClick={onClose}
            >
              ✕ Close
            </button>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Bundle Statistics */}
          <div className="stats-section">
            <h3>📦 Bundle Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{bundleStats.totalComponents || 0}</div>
                <div className="stat-label">Components</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{bundleStats.averageLoadTime?.toFixed(2) || '0'}ms</div>
                <div className="stat-label">Avg Load Time</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{bundleStats.slowestLoadTime?.toFixed(2) || '0'}ms</div>
                <div className="stat-label">Slowest Load</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{(bundleStats.totalBundleSize / 1024).toFixed(1) || '0'}KB</div>
                <div className="stat-label">Bundle Size</div>
              </div>
            </div>
          </div>

          {/* Component Performance */}
          <div className="stats-section">
            <h3>⚡ Component Performance</h3>
            <div className="component-stats">
              {Object.entries(componentStats).map(([componentName, stats]: [string, any]) => (
                <div key={componentName} className="component-stat-card">
                  <div className="component-header">
                    <h4>{componentName}</h4>
                    <span className={`performance-indicator ${stats.averageLoadTime > 1000 ? 'slow' : 'fast'}`}>
                      {stats.averageLoadTime > 1000 ? '🐌' : '⚡'}
                    </span>
                  </div>
                  <div className="component-metrics">
                    <div className="metric">
                      <span className="metric-label">Load Count:</span>
                      <span className="metric-value">{stats.loadCount}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Avg Time:</span>
                      <span className="metric-value">{stats.averageLoadTime.toFixed(2)}ms</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Min Time:</span>
                      <span className="metric-value">{stats.minLoadTime.toFixed(2)}ms</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Max Time:</span>
                      <span className="metric-value">{stats.maxLoadTime.toFixed(2)}ms</span>
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(componentStats).length === 0 && (
                <div className="no-stats">
                  <p>No component statistics available yet.</p>
                  <p>Interact with the app to see performance metrics.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="stats-section">
              <h3>💡 Optimization Recommendations</h3>
              <div className="recommendations">
                {recommendations.map((rec, index) => (
                  <div key={index} className="recommendation">
                    <span className="recommendation-icon">💡</span>
                    <span className="recommendation-text">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 
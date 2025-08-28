'use client'

import React, { useEffect, useState } from 'react';
import { Activity, Zap, Clock, Eye } from 'lucide-react';

interface WebVitals {
  CLS?: number;
  FID?: number;
  FCP?: number;
  LCP?: number;
  TTFB?: number;
}

interface PerformanceMetrics {
  webVitals: WebVitals;
  navigationTiming: {
    dnsLookup: number;
    tcpConnection: number;
    serverResponse: number;
    domContentLoaded: number;
    loadComplete: number;
  } | null;
  resourceTimings: Array<{
    name: string;
    duration: number;
    size: number;
    type: string;
  }>;
  memoryUsage: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null;
}

const PerformanceMonitor: React.FC<{ showDetails?: boolean }> = ({ showDetails = false }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    webVitals: {},
    navigationTiming: null,
    resourceTimings: [],
    memoryUsage: null
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show only in development or when explicitly enabled
    if (process.env.NODE_ENV === 'development' || showDetails) {
      setIsVisible(true);
      collectPerformanceMetrics();
    }
  }, [showDetails]);

  const collectPerformanceMetrics = () => {
    // Navigation Timing
    if (typeof window !== 'undefined' && window.performance && window.performance.navigation) {
      const timing = performance.timing;
      const navigationTiming = {
        dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
        tcpConnection: timing.connectEnd - timing.connectStart,
        serverResponse: timing.responseEnd - timing.requestStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart
      };
      
      setMetrics(prev => ({ ...prev, navigationTiming }));
    }

    // Memory Usage (Chrome only)
    if (typeof window !== 'undefined' && (performance as any).memory) {
      const memoryUsage = (performance as any).memory;
      setMetrics(prev => ({ ...prev, memoryUsage }));
    }

    // Resource Timing
    if (typeof window !== 'undefined' && performance.getEntriesByType) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const resourceTimings = resources
        .filter(resource => resource.duration > 0)
        .map(resource => ({
          name: resource.name.split('/').pop() || resource.name,
          duration: Math.round(resource.duration),
          size: resource.transferSize || 0,
          type: resource.initiatorType || 'other'
        }))
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10);
      
      setMetrics(prev => ({ ...prev, resourceTimings }));
    }

    // Web Vitals (requires web-vitals library in a real implementation)
    // For now, we'll simulate or use basic timing APIs
    if (typeof window !== 'undefined') {
      // LCP approximation
      if (performance.getEntriesByType) {
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        
        if (fcpEntry) {
          setMetrics(prev => ({ 
            ...prev, 
            webVitals: { 
              ...prev.webVitals, 
              FCP: Math.round(fcpEntry.startTime) 
            } 
          }));
        }
      }

      // TTFB
      if (performance.timing) {
        const ttfb = performance.timing.responseStart - performance.timing.requestStart;
        setMetrics(prev => ({ 
          ...prev, 
          webVitals: { 
            ...prev.webVitals, 
            TTFB: ttfb 
          } 
        }));
      }
    }
  };

  const getVitalStatus = (metric: string, value: number) => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'neutral';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatTime = (ms: number) => {
    return `${ms.toFixed(0)}ms`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white shadow-2xl rounded-xl border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Performance Monitor</h3>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ×
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {/* Core Web Vitals */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
            <Zap className="w-4 h-4 mr-2" />
            Core Web Vitals
          </h4>
          <div className="space-y-2">
            {Object.entries(metrics.webVitals).map(([metric, value]) => {
              if (value === undefined) return null;
              const status = getVitalStatus(metric, value);
              return (
                <div key={metric} className={`px-3 py-2 rounded-lg border ${getStatusColor(status)}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{metric}</span>
                    <span className="text-sm">{formatTime(value)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Timing */}
        {metrics.navigationTiming && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Navigation Timing
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>DNS Lookup:</span>
                <span className="font-mono">{formatTime(metrics.navigationTiming.dnsLookup)}</span>
              </div>
              <div className="flex justify-between">
                <span>TCP Connection:</span>
                <span className="font-mono">{formatTime(metrics.navigationTiming.tcpConnection)}</span>
              </div>
              <div className="flex justify-between">
                <span>Server Response:</span>
                <span className="font-mono">{formatTime(metrics.navigationTiming.serverResponse)}</span>
              </div>
              <div className="flex justify-between">
                <span>DOM Content Loaded:</span>
                <span className="font-mono">{formatTime(metrics.navigationTiming.domContentLoaded)}</span>
              </div>
              <div className="flex justify-between">
                <span>Load Complete:</span>
                <span className="font-mono">{formatTime(metrics.navigationTiming.loadComplete)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Memory Usage */}
        {metrics.memoryUsage && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Memory Usage
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Used:</span>
                <span className="font-mono">{formatBytes(metrics.memoryUsage.usedJSHeapSize)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-mono">{formatBytes(metrics.memoryUsage.totalJSHeapSize)}</span>
              </div>
              <div className="flex justify-between">
                <span>Limit:</span>
                <span className="font-mono">{formatBytes(metrics.memoryUsage.jsHeapSizeLimit)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Slow Resources */}
        {metrics.resourceTimings.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Slowest Resources</h4>
            <div className="space-y-1 text-xs">
              {metrics.resourceTimings.slice(0, 5).map((resource, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="truncate max-w-48" title={resource.name}>
                    {resource.name}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-1 py-0.5 rounded text-xs ${
                      resource.type === 'script' ? 'bg-yellow-100 text-yellow-800' :
                      resource.type === 'img' ? 'bg-blue-100 text-blue-800' :
                      resource.type === 'css' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {resource.type}
                    </span>
                    <span className="font-mono">{formatTime(resource.duration)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Score */}
        <div className="border-t pt-4">
          <div className="text-center">
            <button
              onClick={collectPerformanceMetrics}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Refresh Metrics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
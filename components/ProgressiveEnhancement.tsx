'use client';

import React, { 
  useState, useEffect, useCallback, useRef, useMemo,
  createContext, useContext, Suspense, lazy
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EnhancedErrorBoundary from './ErrorBoundary';
import { 
  Wifi, WifiOff, Zap, Battery, BatteryLow, Smartphone,
  Monitor, Download, Upload, CheckCircle, AlertTriangle,
  Loader, Shield, Globe, Settings, Eye, EyeOff
} from 'lucide-react';

// Progressive Enhancement Context
interface ProgressiveEnhancementContext {
  capabilities: DeviceCapabilities;
  networkInfo: NetworkInfo;
  preferences: UserPreferences;
  features: FeatureFlags;
  updatePreference: (key: keyof UserPreferences, value: any) => void;
  isFeatureEnabled: (feature: string) => boolean;
}

interface DeviceCapabilities {
  supportsWebGL: boolean;
  supportsServiceWorker: boolean;
  supportsWebSocket: boolean;
  supportsNotifications: boolean;
  supportsVibration: boolean;
  supportsGeolocation: boolean;
  hasTouch: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: 'small' | 'medium' | 'large' | 'xlarge';
  colorDepth: number;
  pixelRatio: number;
  cores: number;
  memory?: number; // GB
}

interface NetworkInfo {
  online: boolean;
  type: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'unknown';
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  downlink: number; // Mbps
  rtt: number; // ms
  saveData: boolean;
}

interface UserPreferences {
  reducedMotion: boolean;
  reducedData: boolean;
  highContrast: boolean;
  darkMode: boolean;
  autoplay: boolean;
  notifications: boolean;
  realTimeUpdates: boolean;
  optimisticUI: boolean;
  compressionLevel: 'none' | 'low' | 'medium' | 'high';
  qualityLevel: 'low' | 'medium' | 'high' | 'auto';
}

interface FeatureFlags {
  enableWebGL: boolean;
  enableServiceWorker: boolean;
  enableWebSocket: boolean;
  enablePushNotifications: boolean;
  enableGeolocation: boolean;
  enableOfflineMode: boolean;
  enableAdvancedAnimations: boolean;
  enableHighQualityImages: boolean;
  enableVideoPreview: boolean;
  enableAIFeatures: boolean;
  enableAnalytics: boolean;
  enableBatchOperations: boolean;
}

const ProgressiveEnhancementContext = createContext<ProgressiveEnhancementContext | null>(null);

// Hook to use Progressive Enhancement context
export const useProgressiveEnhancement = () => {
  const context = useContext(ProgressiveEnhancementContext);
  if (!context) {
    throw new Error('useProgressiveEnhancement must be used within ProgressiveEnhancementProvider');
  }
  return context;
};

// Device capability detection
const detectDeviceCapabilities = (): DeviceCapabilities => {
  if (typeof window === 'undefined') {
    return {
      supportsWebGL: false,
      supportsServiceWorker: false,
      supportsWebSocket: false,
      supportsNotifications: false,
      supportsVibration: false,
      supportsGeolocation: false,
      hasTouch: false,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      screenSize: 'large',
      colorDepth: 24,
      pixelRatio: 1,
      cores: 4
    };
  }

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  const userAgent = navigator.userAgent.toLowerCase();
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobile = /mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(userAgent);
  const isTablet = /tablet|ipad/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;

  const screenWidth = window.innerWidth;
  const screenSize = screenWidth < 640 ? 'small' :
                    screenWidth < 1024 ? 'medium' :
                    screenWidth < 1440 ? 'large' : 'xlarge';

  return {
    supportsWebGL: !!gl,
    supportsServiceWorker: 'serviceWorker' in navigator,
    supportsWebSocket: 'WebSocket' in window,
    supportsNotifications: 'Notification' in window,
    supportsVibration: 'vibrate' in navigator,
    supportsGeolocation: 'geolocation' in navigator,
    hasTouch,
    isMobile,
    isTablet,
    isDesktop,
    screenSize,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio || 1,
    cores: (navigator as any).hardwareConcurrency || 4,
    memory: (navigator as any).deviceMemory
  };
};

// Network information detection
const detectNetworkInfo = (): NetworkInfo => {
  if (typeof window === 'undefined') {
    return {
      online: true,
      type: 'wifi',
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
      saveData: false
    };
  }

  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;

  return {
    online: navigator.onLine,
    type: connection?.type || 'unknown',
    effectiveType: connection?.effectiveType || '4g',
    downlink: connection?.downlink || 10,
    rtt: connection?.rtt || 100,
    saveData: connection?.saveData || false
  };
};

// Feature flags based on capabilities and preferences
const generateFeatureFlags = (
  capabilities: DeviceCapabilities,
  network: NetworkInfo,
  preferences: UserPreferences
): FeatureFlags => {
  const isSlowNetwork = network.effectiveType === 'slow-2g' || network.effectiveType === '2g';
  const isLowEndDevice = capabilities.cores < 4 || (capabilities.memory && capabilities.memory < 4);
  const isMobileDevice = capabilities.isMobile;

  return {
    enableWebGL: capabilities.supportsWebGL && !isLowEndDevice,
    enableServiceWorker: capabilities.supportsServiceWorker,
    enableWebSocket: capabilities.supportsWebSocket && preferences.realTimeUpdates,
    enablePushNotifications: capabilities.supportsNotifications && preferences.notifications,
    enableGeolocation: capabilities.supportsGeolocation,
    enableOfflineMode: capabilities.supportsServiceWorker,
    enableAdvancedAnimations: !preferences.reducedMotion && !isSlowNetwork && !isLowEndDevice,
    enableHighQualityImages: !preferences.reducedData && !isSlowNetwork && preferences.qualityLevel !== 'low',
    enableVideoPreview: !isMobileDevice && !isSlowNetwork && preferences.autoplay,
    enableAIFeatures: !isSlowNetwork && !isLowEndDevice,
    enableAnalytics: network.online,
    enableBatchOperations: !isSlowNetwork && preferences.optimisticUI
  };
};

// Progressive Enhancement Provider
interface ProgressiveEnhancementProviderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProgressiveEnhancementProvider: React.FC<ProgressiveEnhancementProviderProps> = ({ 
  children, 
  fallback 
}) => {
  const [capabilities] = useState<DeviceCapabilities>(() => detectDeviceCapabilities());
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(() => detectNetworkInfo());
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    // Load from localStorage or detect system preferences
    const stored = typeof window !== 'undefined' ? localStorage.getItem('progressive_preferences') : null;
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('Failed to parse stored preferences:', e);
      }
    }

    // Detect system preferences
    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersDarkMode = typeof window !== 'undefined' && 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const prefersHighContrast = typeof window !== 'undefined' && 
      window.matchMedia('(prefers-contrast: high)').matches;
    
    return {
      reducedMotion: prefersReducedMotion,
      reducedData: capabilities.isMobile || networkInfo.saveData,
      highContrast: prefersHighContrast,
      darkMode: prefersDarkMode,
      autoplay: !capabilities.isMobile,
      notifications: true,
      realTimeUpdates: true,
      optimisticUI: true,
      compressionLevel: capabilities.isMobile || networkInfo.saveData ? 'high' : 'medium',
      qualityLevel: 'auto'
    };
  });

  const features = useMemo(
    () => generateFeatureFlags(capabilities, networkInfo, preferences),
    [capabilities, networkInfo, preferences]
  );

  // Update network info when connection changes
  useEffect(() => {
    const updateNetworkInfo = () => {
      setNetworkInfo(detectNetworkInfo());
    };

    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);

    // Monitor connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }

    return () => {
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('progressive_preferences', JSON.stringify(preferences));
    } catch (e) {
      console.warn('Failed to save preferences:', e);
    }
  }, [preferences]);

  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, []);

  const isFeatureEnabled = useCallback((feature: string) => {
    return (features as any)[feature] === true;
  }, [features]);

  const contextValue: ProgressiveEnhancementContext = {
    capabilities,
    networkInfo,
    preferences,
    features,
    updatePreference,
    isFeatureEnabled
  };

  return (
    <ProgressiveEnhancementContext.Provider value={contextValue}>
      <EnhancedErrorBoundary
        level="page"
        showDetails={true}
        maxRetries={3}
        onError={(error, errorInfo) => {
          console.error('Progressive Enhancement Error:', error, errorInfo);
        }}
      >
        <Suspense fallback={fallback || <ProgressiveLoadingFallback />}>
          {children}
        </Suspense>
      </EnhancedErrorBoundary>
    </ProgressiveEnhancementContext.Provider>
  );
};

// Loading fallback for progressive enhancement
const ProgressiveLoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
    <div className="text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
      />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        アプリケーションを最適化中
      </h2>
      <p className="text-gray-600">
        デバイスに最適な体験を準備しています
      </p>
    </div>
  </div>
);

// Component for displaying system capabilities (debug/info)
export const CapabilitiesInfo: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { capabilities, networkInfo, features, preferences } = useProgressiveEnhancement();
  const [isExpanded, setIsExpanded] = useState(false);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <motion.div 
      className={`fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border max-w-sm ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span className="font-medium">システム情報</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </motion.div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t max-h-96 overflow-y-auto"
          >
            <div className="p-4 space-y-4 text-sm">
              {/* Device Info */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">デバイス</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>タイプ: {capabilities.isMobile ? 'Mobile' : capabilities.isTablet ? 'Tablet' : 'Desktop'}</div>
                  <div>画面: {capabilities.screenSize}</div>
                  <div>タッチ: {capabilities.hasTouch ? '有' : '無'}</div>
                  <div>コア数: {capabilities.cores}</div>
                  {capabilities.memory && <div>メモリ: {capabilities.memory}GB</div>}
                  <div>PixelRatio: {capabilities.pixelRatio}</div>
                </div>
              </div>

              {/* Network Info */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">ネットワーク</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-1">
                    {networkInfo.online ? (
                      <><Wifi className="w-3 h-3 text-green-500" /><span>オンライン</span></>
                    ) : (
                      <><WifiOff className="w-3 h-3 text-red-500" /><span>オフライン</span></>
                    )}
                  </div>
                  <div>タイプ: {networkInfo.effectiveType}</div>
                  <div>速度: {networkInfo.downlink}Mbps</div>
                  <div>RTT: {networkInfo.rtt}ms</div>
                  <div>データ節約: {networkInfo.saveData ? '有' : '無'}</div>
                </div>
              </div>

              {/* Enabled Features */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">有効な機能</h4>
                <div className="grid grid-cols-1 gap-1 text-xs">
                  {Object.entries(features).filter(([_, enabled]) => enabled).map(([feature, _]) => (
                    <div key={feature} className="flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>{feature.replace('enable', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Preferences */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">設定</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>モーション削減: {preferences.reducedMotion ? '有' : '無'}</div>
                  <div>データ節約: {preferences.reducedData ? '有' : '無'}</div>
                  <div>ダークモード: {preferences.darkMode ? '有' : '無'}</div>
                  <div>高コントラスト: {preferences.highContrast ? '有' : '無'}</div>
                  <div>自動再生: {preferences.autoplay ? '有' : '無'}</div>
                  <div>通知: {preferences.notifications ? '有' : '無'}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Progressive Image Component
interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  quality?: 'low' | 'medium' | 'high' | 'auto';
  loading?: 'lazy' | 'eager';
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = '/placeholder.svg',
  quality = 'auto',
  loading = 'lazy'
}) => {
  const { preferences, networkInfo, features } = useProgressiveEnhancement();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const getOptimizedSrc = () => {
    if (!features.enableHighQualityImages || preferences.reducedData) {
      return src.replace(/\.(jpg|jpeg|png)$/, '_compressed.$1');
    }

    const qualityLevel = quality === 'auto' 
      ? networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g' ? 'low' : 'high'
      : quality;

    return src.replace(/\.(jpg|jpeg|png)$/, `_${qualityLevel}.$1`);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence>
        {!loaded && !error && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-200 flex items-center justify-center"
          >
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.img
        src={error ? placeholder : getOptimizedSrc()}
        alt={alt}
        loading={loading}
        className="w-full h-full object-cover"
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
};

// Adaptive Animation Wrapper
interface AdaptiveAnimationProps {
  children: React.ReactNode;
  animation?: 'fade' | 'slide' | 'scale' | 'bounce';
  duration?: number;
  disabled?: boolean;
}

export const AdaptiveAnimation: React.FC<AdaptiveAnimationProps> = ({
  children,
  animation = 'fade',
  duration = 0.3,
  disabled = false
}) => {
  const { preferences, features } = useProgressiveEnhancement();

  if (disabled || preferences.reducedMotion || !features.enableAdvancedAnimations) {
    return <>{children}</>;
  }

  const animations = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    slide: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 }
    },
    scale: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.8 }
    },
    bounce: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 }
    }
  };

  return (
    <motion.div
      {...animations[animation]}
      transition={{ duration }}
    >
      {children}
    </motion.div>
  );
};

export default ProgressiveEnhancementProvider;
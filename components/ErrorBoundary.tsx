'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, RefreshCw, Bug, Shield, Wifi, WifiOff, 
  Clock, CheckCircle, XCircle, AlertCircle, Info,
  Home, ArrowLeft, Download, Upload, Database
} from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
  errorId?: string
  retryCount: number
  lastErrorTime: number
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ 
    error?: Error
    errorInfo?: React.ErrorInfo
    resetError: () => void
    retryCount: number
  }>
  level?: 'page' | 'component' | 'critical'
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  maxRetries?: number
  retryDelay?: number
  showDetails?: boolean
}

interface NetworkStatus {
  online: boolean
  effectiveType?: string
  downlink?: number
  rtt?: number
}

interface ErrorReport {
  errorId: string
  message: string
  stack?: string
  componentStack?: string
  timestamp: number
  url: string
  userAgent: string
  networkStatus: NetworkStatus
  retryCount: number
}

// Enhanced Error Boundary with comprehensive recovery mechanisms
class EnhancedErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null
  private networkListener: (() => void) | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { 
      hasError: false,
      retryCount: 0,
      lastErrorTime: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return { 
      hasError: true, 
      error,
      errorId,
      lastErrorTime: Date.now()
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.group('🚨 ErrorBoundary: Error Caught')
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Component Stack:', errorInfo.componentStack)
    console.groupEnd()

    // Update state with error info
    this.setState({ errorInfo })

    // Call external error handler
    this.props.onError?.(error, errorInfo)

    // Generate error report
    this.generateErrorReport(error, errorInfo)

    // Set up network monitoring for recovery
    this.setupNetworkMonitoring()

    // Auto-retry for transient errors
    this.scheduleAutoRetry(error)
  }

  private generateErrorReport(error: Error, errorInfo: React.ErrorInfo): ErrorReport {
    const networkStatus = this.getNetworkStatus()
    
    const report: ErrorReport = {
      errorId: this.state.errorId || 'unknown',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      networkStatus,
      retryCount: this.state.retryCount
    }

    // Store error report locally for debugging
    try {
      localStorage.setItem(`error_report_${report.errorId}`, JSON.stringify(report))
    } catch (e) {
      console.warn('Failed to store error report:', e)
    }

    return report
  }

  private getNetworkStatus(): NetworkStatus {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    
    return {
      online: navigator.onLine,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt
    }
  }

  private setupNetworkMonitoring() {
    if (this.networkListener) return

    const handleNetworkChange = () => {
      if (navigator.onLine && this.state.hasError) {
        console.log('🌐 Network restored, attempting recovery...')
        this.handleRetry()
      }
    }

    window.addEventListener('online', handleNetworkChange)
    this.networkListener = () => window.removeEventListener('online', handleNetworkChange)
  }

  private scheduleAutoRetry(error: Error) {
    const { maxRetries = 3, retryDelay = 3000 } = this.props
    
    // Auto-retry for certain error types
    const retryableErrors = [
      'ChunkLoadError',
      'NetworkError',
      'Failed to fetch',
      'Load failed'
    ]

    const isRetryable = retryableErrors.some(pattern => 
      error.message.includes(pattern) || error.name.includes(pattern)
    )

    if (isRetryable && this.state.retryCount < maxRetries) {
      console.log(`🔄 Scheduling auto-retry ${this.state.retryCount + 1}/${maxRetries} in ${retryDelay}ms`)
      
      this.retryTimeoutId = setTimeout(() => {
        this.handleRetry()
      }, retryDelay * (this.state.retryCount + 1)) // Exponential backoff
    }
  }

  private handleRetry = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
      this.retryTimeoutId = null
    }

    console.log('🔄 Attempting error recovery...')
    
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
      retryCount: prevState.retryCount + 1
    }))
  }

  private handleHardRefresh = () => {
    // Clear any cached data that might be causing issues
    try {
      localStorage.removeItem('createPost_draft')
      sessionStorage.clear()
    } catch (e) {
      console.warn('Failed to clear storage:', e)
    }
    
    window.location.reload()
  }

  private handleNavigateHome = () => {
    window.location.href = '/'
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
    if (this.networkListener) {
      this.networkListener()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent 
            error={this.state.error} 
            errorInfo={this.state.errorInfo}
            resetError={this.handleRetry}
            retryCount={this.state.retryCount}
          />
        )
      }

      return (
        <ErrorFallbackUI
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          retryCount={this.state.retryCount}
          level={this.props.level}
          showDetails={this.props.showDetails}
          onRetry={this.handleRetry}
          onHardRefresh={this.handleHardRefresh}
          onNavigateHome={this.handleNavigateHome}
          maxRetries={this.props.maxRetries || 3}
        />
      )
    }

    return this.props.children
  }
}

// Comprehensive Error Fallback UI Component
interface ErrorFallbackUIProps {
  error?: Error
  errorInfo?: React.ErrorInfo
  errorId?: string
  retryCount: number
  level?: 'page' | 'component' | 'critical'
  showDetails?: boolean
  onRetry: () => void
  onHardRefresh: () => void
  onNavigateHome: () => void
  maxRetries: number
}

const ErrorFallbackUI: React.FC<ErrorFallbackUIProps> = ({
  error,
  errorInfo,
  errorId,
  retryCount,
  level = 'component',
  showDetails = false,
  onRetry,
  onHardRefresh,
  onNavigateHome,
  maxRetries
}) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({ online: navigator.onLine })
  const [showDetailedInfo, setShowDetailedInfo] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  // Monitor network status
  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      
      setNetworkStatus({
        online: navigator.onLine,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt
      })
    }

    const handleOnline = () => updateNetworkStatus()
    const handleOffline = () => updateNetworkStatus()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    updateNetworkStatus()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetryWithAnimation = useCallback(async () => {
    setIsRetrying(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    onRetry()
    setIsRetrying(false)
  }, [onRetry])

  const getErrorType = () => {
    if (!error) return 'unknown'
    
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'chunk_load'
    }
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return 'network'
    }
    if (error.message.includes('TypeError')) {
      return 'type_error'
    }
    if (error.message.includes('ReferenceError')) {
      return 'reference_error'
    }
    return 'generic'
  }

  const getErrorIcon = () => {
    const type = getErrorType()
    switch (type) {
      case 'network': return networkStatus.online ? Wifi : WifiOff
      case 'chunk_load': return Download
      case 'type_error': return Bug
      case 'reference_error': return AlertCircle
      default: return AlertTriangle
    }
  }

  const getErrorTitle = () => {
    const type = getErrorType()
    switch (type) {
      case 'network': return 'ネットワークエラー'
      case 'chunk_load': return 'リソース読み込みエラー'
      case 'type_error': return 'プログラムエラー'
      case 'reference_error': return '参照エラー'
      default: return '予期しないエラーが発生しました'
    }
  }

  const getErrorDescription = () => {
    const type = getErrorType()
    switch (type) {
      case 'network': return 'インターネット接続を確認してください'
      case 'chunk_load': return 'アプリケーションの更新が必要な可能性があります'
      case 'type_error': return 'アプリケーションの内部エラーです'
      case 'reference_error': return 'コンポーネントの読み込みに失敗しました'
      default: return 'システムエラーが発生しました。しばらくしてから再試行してください。'
    }
  }

  const canRetry = retryCount < maxRetries
  const ErrorIcon = getErrorIcon()

  const containerHeight = level === 'page' ? 'min-h-screen' : 
                         level === 'critical' ? 'min-h-[600px]' : 
                         'min-h-[400px]'

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`${containerHeight} flex items-center justify-center p-6 bg-gradient-to-br from-red-50 to-orange-50`}
    >
      <div className="text-center max-w-2xl mx-auto">
        {/* Error Icon */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
        >
          <ErrorIcon className="w-10 h-10 text-red-600" />
        </motion.div>

        {/* Error Title */}
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 mb-3"
        >
          {getErrorTitle()}
        </motion.h2>

        {/* Error Description */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-6 leading-relaxed"
        >
          {getErrorDescription()}
        </motion.p>

        {/* Network Status */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center mb-6"
        >
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm ${
            networkStatus.online 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {networkStatus.online ? (
              <><CheckCircle className="w-4 h-4" /><span>オンライン</span></>
            ) : (
              <><XCircle className="w-4 h-4" /><span>オフライン</span></>
            )}
          </div>
        </motion.div>

        {/* Retry Information */}
        {retryCount > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-3 bg-blue-50 rounded-lg"
          >
            <div className="flex items-center justify-center text-blue-800 text-sm">
              <Clock className="w-4 h-4 mr-2" />
              <span>再試行回数: {retryCount}/{maxRetries}</span>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-4 mb-6"
        >
          {canRetry && (
            <button
              onClick={handleRetryWithAnimation}
              disabled={isRetrying}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50"
            >
              <AnimatePresence mode="wait">
                {isRetrying ? (
                  <motion.div
                    key="spinning"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </AnimatePresence>
              <span>{isRetrying ? '再試行中...' : '再試行'}</span>
            </button>
          )}
          
          <button
            onClick={onHardRefresh}
            className="flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            <span>ページを再読み込み</span>
          </button>

          {level === 'page' && (
            <button
              onClick={onNavigateHome}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>ホームに戻る</span>
            </button>
          )}
        </motion.div>

        {/* Error Details Toggle */}
        {(showDetails || process.env.NODE_ENV === 'development') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-left"
          >
            <button
              onClick={() => setShowDetailedInfo(!showDetailedInfo)}
              className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mx-auto mb-4"
            >
              <Bug className="w-4 h-4" />
              <span>{showDetailedInfo ? '詳細を非表示' : '詳細を表示'}</span>
            </button>

            <AnimatePresence>
              {showDetailedInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-100 rounded-lg p-4 text-left text-sm font-mono max-h-64 overflow-auto"
                >
                  <div className="mb-2">
                    <strong>Error ID:</strong> {errorId}
                  </div>
                  <div className="mb-2">
                    <strong>Message:</strong> {error?.message}
                  </div>
                  {error?.stack && (
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="mt-1 text-xs overflow-x-auto">{error.stack}</pre>
                    </div>
                  )}
                  {errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 text-xs overflow-x-auto">{errorInfo.componentStack}</pre>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default EnhancedErrorBoundary

// Export the original simple ErrorBoundary for backward compatibility
export { EnhancedErrorBoundary as ErrorBoundary }
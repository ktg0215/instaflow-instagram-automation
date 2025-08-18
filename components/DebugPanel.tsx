import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useInstagram } from '../hooks/useInstagram';
import { logger, LogLevel } from '../lib/logger';
import { Bug, Database, User, CheckCircle, XCircle, AlertTriangle, Instagram, Zap, RefreshCw, FileText } from 'lucide-react';

const DebugPanel: React.FC = () => {
  const { user, loading } = useAuth();
  const { isConnected: instagramConnected, profile: instagramProfile } = useInstagram(user?.id ? String(user.id) : undefined);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [activeTab, setActiveTab] = useState<'status' | 'logs'>('status');
  const [tableStatus, setTableStatus] = useState<Record<string, boolean>>({});
  const [envStatus, setEnvStatus] = useState<Record<string, boolean>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    checkAll();
    const interval = setInterval(checkAll, 10000); // 10秒ごとに更新
    return () => clearInterval(interval);
  }, []);

  const checkAll = async () => {
    await Promise.all([
      checkDatabaseConnection(),
      checkTables(),
      checkEnvironmentVariables()
    ]);
    setLastUpdate(new Date());
  };

  const checkEnvironmentVariables = () => {
    const envVars = {
      'NEXT_PUBLIC_GOOGLE_AI_API_KEY': !!process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY,
      'NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN': !!process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN,
    } as Record<string, boolean>;
    setEnvStatus(envVars);
  };

  const checkDatabaseConnection = async () => {
    logger.debug('Checking database connection', 'DebugPanel');
    try {
      const response = await fetch('/api/health/db');
      const data = await response.json();
      if (data.ok) {
        setDbStatus('connected');
        logger.info('Database connection: OK', 'DebugPanel');
      } else {
        setDbStatus('error');
        logger.warn('Database connection: ERROR', 'DebugPanel');
      }
    } catch (error) {
      logger.error('Database connection check failed', 'DebugPanel', error);
      setDbStatus('error');
    }
  };

  const checkTables = async () => {
    const tables = ['profiles', 'instagram_accounts', 'posts', 'ai_requests'];
    const status: Record<string, boolean> = {};

    // TODO: PostgreSQL実装に変更
    for (const table of tables) {
      status[table] = false;
    }
    
    setTableStatus(status);
    
    // 一時的にSupabase関連機能を無効化
    // for (const table of tables) {
    //   try {
    //     const { error } = await supabase.from(table).select('count').limit(1);
    //     status[table] = !error;
    //   } catch (error) {
    //     status[table] = false;
    //   }
    // }

    // setTableStatus(status);
  };

  const getDebugInfo = () => {
    return {
      timestamp: lastUpdate.toLocaleTimeString('ja-JP'),
      user: user ? {
        id: user.id.toString().substring(0, 8) + '...',
        email: user.email,
        created_at: user.created_at
      } : null,
      profile: instagramProfile ? {
        id: instagramProfile.id?.substring(0, 8) + '...' || 'N/A',
        user_id: user?.id.toString().substring(0, 8) + '...' || 'N/A',
        email: user?.email || 'N/A',
        timezone: 'N/A',
        language: 'N/A'
      } : null,
      instagram: instagramProfile ? {
        id: instagramProfile.id,
        username: instagramProfile.username,
        account_type: instagramProfile.account_type,
        media_count: instagramProfile.media_count
      } : null,
      environment: {
        hasGoogleAIKey: !!process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY,
        hasInstagramToken: !!process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN,
      },
      status: {
        authLoading: loading,
        dbStatus,
        instagramConnected,
        tableStatus,
        envStatus
      }
    };
  };

  const StatusIcon = ({ status }: { status: boolean | string }) => {
    if (status === true || status === 'connected') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (status === 'checking') {
      return <AlertTriangle className="w-4 h-4 text-yellow-500 animate-pulse" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getOverallStatus = () => {
    const hasUser = !!user;
    const hasProfile = !!instagramProfile;
    const dbConnected = dbStatus === 'connected';
    const allTablesOk = Object.values(tableStatus).every(status => status);
    const allEnvVarsOk = Object.values(envStatus).every(status => status);

    if (hasUser && hasProfile && dbConnected && allTablesOk && allEnvVarsOk) {
      return { status: 'healthy', color: 'text-green-600', message: '正常' };
    } else if (hasUser && dbConnected) {
      return { status: 'warning', color: 'text-yellow-600', message: '警告' };
    } else {
      return { status: 'error', color: 'text-red-600', message: 'エラー' };
    }
  };

  const overallStatus = getOverallStatus();
  const logs = logger.getLogs().slice(-20); // Show last 20 logs

  const getLogLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG: return 'text-gray-500'
      case LogLevel.INFO: return 'text-blue-600'
      case LogLevel.WARN: return 'text-yellow-600'
      case LogLevel.ERROR: return 'text-red-600'
      default: return 'text-gray-600'
    }
  };

  const getLogLevelName = (level: LogLevel) => {
    return LogLevel[level];
  };

  // 開発環境でのみ表示
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`bg-white rounded-lg shadow-lg border transition-all duration-300 ${
        isExpanded ? 'w-96 max-h-96 overflow-y-auto' : 'w-64'
      }`}>
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center">
            <Bug className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-gray-900">Debug Panel</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${overallStatus.color}`}>
              {overallStatus.message}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                checkAll();
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Compact Status */}
        {!isExpanded && (
          <div className="px-4 pb-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                認証
              </span>
              <StatusIcon status={!!user} />
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center">
                <Database className="w-4 h-4 mr-2" />
                DB
              </span>
              <StatusIcon status={dbStatus} />
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center">
                <Instagram className="w-4 h-4 mr-2" />
                Instagram
              </span>
              <StatusIcon status={instagramConnected} />
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        {isExpanded && (
          <div className="border-t border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('status')}
                className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'status'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Database className="w-4 h-4 inline-block mr-1" />
                Status
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'logs'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="w-4 h-4 inline-block mr-1" />
                Logs ({logs.length})
              </button>
            </div>
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && activeTab === 'status' && (
          <div className="px-4 pb-4 space-y-4 text-sm">
            {/* Environment Variables */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                <Zap className="w-4 h-4 mr-1" />
                環境変数
              </h4>
              <div className="space-y-1 ml-5">
                {Object.entries(envStatus).map(([key, status]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs">{key.replace('NEXT_PUBLIC_', '')}</span>
                    <StatusIcon status={status} />
                  </div>
                ))}
              </div>
            </div>

            {/* Authentication */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                <User className="w-4 h-4 mr-1" />
                認証状態
              </h4>
              <div className="space-y-1 ml-5">
                <div className="flex items-center justify-between">
                  <span>ユーザー</span>
                  <StatusIcon status={!!user} />
                </div>
                <div className="flex items-center justify-between">
                  <span>プロフィール</span>
                  <StatusIcon status={!!instagramProfile} />
                </div>
                <div className="flex items-center justify-between">
                  <span>読み込み中</span>
                  <StatusIcon status={!loading} />
                </div>
              </div>
            </div>

            {/* Database */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                <Database className="w-4 h-4 mr-1" />
                データベース
              </h4>
              <div className="space-y-1 ml-5">
                <div className="flex items-center justify-between">
                  <span>接続</span>
                  <StatusIcon status={dbStatus} />
                </div>
                {Object.entries(tableStatus).map(([table, status]) => (
                  <div key={table} className="flex items-center justify-between">
                    <span className="text-xs">{table}</span>
                    <StatusIcon status={status} />
                  </div>
                ))}
              </div>
            </div>

            {/* Instagram */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                <Instagram className="w-4 h-4 mr-1" />
                Instagram
              </h4>
              <div className="space-y-1 ml-5">
                <div className="flex items-center justify-between">
                  <span>接続状態</span>
                  <StatusIcon status={instagramConnected} />
                </div>
                {instagramProfile && (
                  <>
                    <div className="text-xs text-gray-600">
                      @{instagramProfile.username}
                    </div>
                    <div className="text-xs text-gray-600">
                      {instagramProfile.media_count} 投稿
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Debug Info */}
            <details className="border-t pt-2">
              <summary className="cursor-pointer font-medium text-gray-700 text-xs">
                詳細情報
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(getDebugInfo(), null, 2)}
              </pre>
            </details>

            <div className="text-xs text-gray-500 text-center border-t pt-2">
              最終更新: {lastUpdate.toLocaleTimeString('ja-JP')}
            </div>
          </div>
        )}

        {/* Logs Tab Content */}
        {isExpanded && activeTab === 'logs' && (
          <div className="px-4 pb-4 text-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">Recent Logs ({logs.length})</span>
              <button
                onClick={() => logger.clearLogs()}
                className="text-xs text-gray-400 hover:text-red-600 transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto text-xs">
              {logs.length === 0 ? (
                <div className="text-gray-500 text-center py-4">No logs available</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="border-b border-gray-100 pb-1 mb-1">
                    <div className="flex justify-between items-start">
                      <span className={`font-mono text-xs ${getLogLevelColor(log.level)}`}>
                        {getLogLevelName(log.level)}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    {log.context && (
                      <div className="text-gray-600 text-xs">[{log.context}]</div>
                    )}
                    <div className="text-gray-800 text-xs break-words">{log.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;
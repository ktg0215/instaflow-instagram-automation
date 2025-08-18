import React, { useState } from 'react';
import { format, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Calendar, Clock, Plus, Edit, Trash2, Play, Pause, CheckCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface ScheduledPost {
  id: string;
  caption: string;
  imageUrl?: string;
  scheduledAt: Date;
  status: 'scheduled' | 'published' | 'failed' | 'paused';
  hashtags?: string[];
  createdAt: Date;
}

interface ScheduleManagerProps {
  scheduledPosts?: ScheduledPost[];
  onSchedulePost?: (postData: any) => void;
  onUpdateSchedule?: (id: string, scheduledAt: Date) => void;
  onCancelSchedule?: (id: string) => void;
  onPauseSchedule?: (id: string) => void;
  onResumeSchedule?: (id: string) => void;
}

const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  scheduledPosts = [],
  onSchedulePost,
  onUpdateSchedule,
  onCancelSchedule,
  onPauseSchedule,
  onResumeSchedule
}) => {
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');

  // 予約可能な時間スロット（例：9時〜21時、1時間刻み）
  const timeSlots = [];
  for (let hour = 9; hour <= 21; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 21) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }

  // 最適な投稿時間の提案
  const suggestedTimes = [
    { time: '09:00', label: '朝の通勤時間', description: '多くの人が活動を開始する時間' },
    { time: '12:00', label: 'ランチタイム', description: 'お昼休憩でSNSをチェックする時間' },
    { time: '18:00', label: '夕方の帰宅時間', description: '仕事終わりのリラックスタイム' },
    { time: '21:00', label: '夜のゆったり時間', description: '一日を振り返る時間' }
  ];

  // 日付選択（今日から30日後まで）
  const availableDates = [];
  for (let i = 0; i < 30; i++) {
    const date = addDays(new Date(), i);
    availableDates.push(date);
  }

  const handleScheduleDateTime = (date: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledDateTime = new Date(date);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    // 過去の時間を選択できないようにチェック
    if (isBefore(scheduledDateTime, new Date())) {
      showToast({
        type: 'warning',
        title: '無効な時間',
        message: '現在時刻より未来の時間を選択してください'
      });
      return null;
    }

    return scheduledDateTime;
  };

  const getStatusColor = (status: ScheduledPost['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ScheduledPost['status']) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-4 h-4" />;
      case 'published':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <Trash2 className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // 日付別の投稿数を取得
  const getPostCountByDate = (date: Date) => {
    return scheduledPosts.filter(post => 
      format(post.scheduledAt, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    ).length;
  };

  // 選択された日付の投稿を取得
  const getPostsByDate = (date: Date) => {
    return scheduledPosts.filter(post =>
      format(post.scheduledAt, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    ).sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">予約投稿管理</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* 表示モード切り替え */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              リスト表示
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              カレンダー表示
            </button>
          </div>
        </div>
      </div>

      {/* 最適化されたスケジューリング */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-purple-900 mb-4">最適な投稿時間</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {suggestedTimes.map((suggestion) => (
            <button
              key={suggestion.time}
              onClick={() => setSelectedTime(suggestion.time)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedTime === suggestion.time
                  ? 'border-purple-600 bg-white shadow-md'
                  : 'border-purple-200 bg-white/50 hover:border-purple-400'
              }`}
            >
              <div className="font-semibold text-purple-900">{suggestion.time}</div>
              <div className="text-sm font-medium text-purple-700 mt-1">{suggestion.label}</div>
              <div className="text-xs text-purple-600 mt-1">{suggestion.description}</div>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-purple-700 mb-2">日付選択</label>
            <select
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
              className="px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {availableDates.map((date) => {
                const postCount = getPostCountByDate(date);
                return (
                  <option key={format(date, 'yyyy-MM-dd')} value={format(date, 'yyyy-MM-dd')}>
                    {format(date, 'M月d日(E)', { locale: ja })}
                    {postCount > 0 && ` (${postCount}件)`}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-700 mb-2">時間選択</label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                const scheduledDateTime = handleScheduleDateTime(selectedDate, selectedTime);
                if (scheduledDateTime && onSchedulePost) {
                  onSchedulePost({
                    scheduledAt: scheduledDateTime
                  });
                }
              }}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>この時間で予約</span>
            </button>
          </div>
        </div>
      </div>

      {/* 投稿一覧 */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              予約投稿一覧 ({scheduledPosts.length}件)
            </h3>
          </div>

          {scheduledPosts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>予約された投稿がありません</p>
              <p className="text-sm mt-1">新しい投稿を予約してください</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {scheduledPosts.map((post) => (
                <div key={post.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                          {getStatusIcon(post.status)}
                          <span>{post.status === 'scheduled' ? '予約中' : post.status === 'published' ? '投稿済み' : post.status === 'failed' ? '失敗' : '一時停止'}</span>
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(post.scheduledAt, 'M月d日(E) H:mm', { locale: ja })}
                        </span>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        {post.imageUrl && (
                          <img
                            src={post.imageUrl}
                            alt="投稿画像"
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-gray-900 line-clamp-2">{post.caption}</p>
                          {post.hashtags && post.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {post.hashtags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                >
                                  #{tag}
                                </span>
                              ))}
                              {post.hashtags.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{post.hashtags.length - 3}個
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {post.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => onPauseSchedule?.(post.id)}
                            className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                            title="一時停止"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              const newTime = prompt('新しい投稿時間を入力してください (例: 2024-12-01 14:30)');
                              if (newTime) {
                                const newDate = new Date(newTime);
                                if (!isNaN(newDate.getTime()) && isAfter(newDate, new Date())) {
                                  onUpdateSchedule?.(post.id, newDate);
                                } else {
                                  showToast({
                                    type: 'error',
                                    title: '無効な日時',
                                    message: '正しい日時形式で、未来の時間を入力してください'
                                  });
                                }
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="時間変更"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {post.status === 'paused' && (
                        <button
                          onClick={() => onResumeSchedule?.(post.id)}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title="再開"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (confirm('この予約投稿を削除しますか？')) {
                            onCancelSchedule?.(post.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* カレンダー表示 */
        <div className="bg-white rounded-lg border p-6">
          <div className="grid grid-cols-7 gap-4 mb-4">
            {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {availableDates.slice(0, 21).map((date, index) => {
              const postCount = getPostCountByDate(date);
              const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
              
              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`
                    relative p-3 rounded-lg border-2 transition-all text-left
                    ${isSelected
                      ? 'border-purple-600 bg-purple-50'
                      : postCount > 0
                        ? 'border-blue-200 bg-blue-50 hover:border-blue-400'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-400'
                    }
                  `}
                >
                  <div className="text-sm font-medium text-gray-900">
                    {format(date, 'd')}
                  </div>
                  {postCount > 0 && (
                    <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {postCount}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* 選択された日付の詳細 */}
          {format(selectedDate, 'yyyy-MM-dd') && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                {format(selectedDate, 'M月d日(E)', { locale: ja })}の予約投稿
              </h4>
              
              {getPostsByDate(selectedDate).length === 0 ? (
                <p className="text-gray-500">この日の予約投稿はありません</p>
              ) : (
                <div className="space-y-3">
                  {getPostsByDate(selectedDate).map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-900">
                          {format(post.scheduledAt, 'H:mm')}
                        </span>
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                          {getStatusIcon(post.status)}
                        </span>
                        <span className="text-sm text-gray-700 truncate max-w-xs">
                          {post.caption}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            if (confirm('この予約投稿を削除しますか？')) {
                              onCancelSchedule?.(post.id);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleManager;
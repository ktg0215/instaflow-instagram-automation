'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Smartphone, Monitor, Volume2, VolumeX } from 'lucide-react';

interface InstagramPreviewProps {
  caption: string;
  mediaUrl?: string;
  hashtags?: string[];
  username?: string;
  profileImage?: string;
  device?: 'mobile' | 'desktop';
  showEngagement?: boolean;
}

const InstagramPreview: React.FC<InstagramPreviewProps> = ({
  caption,
  mediaUrl,
  hashtags = [],
  username = 'your_username',
  profileImage,
  device: initialDevice = 'mobile',
  showEngagement = true
}) => {
  const [device, setDevice] = useState<'mobile' | 'desktop'>(initialDevice);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const isVideo = mediaUrl?.includes('video') || mediaUrl?.includes('.mp4') || mediaUrl?.includes('.mov');
  const mockLikes = Math.floor(Math.random() * 1000) + 100;
  const mockComments = Math.floor(Math.random() * 50) + 10;

  // Truncate caption for preview
  const displayCaption = caption.length > 125 && !showFullCaption 
    ? caption.slice(0, 125) + '...' 
    : caption;

  const formatHashtags = (tags: string[]) => {
    return tags.map(tag => `#${tag}`).join(' ');
  };

  const containerClass = device === 'mobile' 
    ? 'max-w-sm mx-auto' 
    : 'max-w-md mx-auto';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border overflow-hidden"
    >
      {/* Device Toggle */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">プレビュー</h3>
          <div className="flex space-x-1 bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setDevice('mobile')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md transition-colors ${
                device === 'mobile' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="text-xs">Mobile</span>
            </button>
            <button
              onClick={() => setDevice('desktop')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md transition-colors ${
                device === 'desktop' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span className="text-xs">Desktop</span>
            </button>
          </div>
        </div>
      </div>

      {/* Instagram Post Preview */}
      <div className={`${containerClass} bg-black p-2`}>
        <div className="bg-white rounded-lg overflow-hidden shadow-xl">
          {/* Post Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center space-x-3">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-[2px]">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-gray-600">
                        {username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{username}</p>
                <p className="text-xs text-gray-500">sponsored</p>
              </div>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <MoreHorizontal className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          {/* Media */}
          <div className="relative bg-gray-100 aspect-square">
            {mediaUrl ? (
              <div className="relative w-full h-full">
                {isVideo ? (
                  <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                    <video 
                      src={mediaUrl}
                      className="w-full h-full object-cover"
                      muted={isMuted}
                      loop
                      autoPlay
                      playsInline
                    />
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="absolute bottom-3 right-3 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <motion.img 
                    src={mediaUrl} 
                    alt="Post content" 
                    className="w-full h-full object-cover"
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 bg-gray-300 rounded"></div>
                  </div>
                  <p className="text-gray-500 text-sm">画像を追加してください</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Actions */}
          {showEngagement && (
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => setIsLiked(!isLiked)}
                    className={`transition-colors ${isLiked ? 'text-red-500' : 'text-gray-700 hover:text-gray-500'}`}
                  >
                    <Heart 
                      className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} 
                    />
                  </motion.button>
                  <button className="text-gray-700 hover:text-gray-500 transition-colors">
                    <MessageCircle className="w-6 h-6" />
                  </button>
                  <button className="text-gray-700 hover:text-gray-500 transition-colors">
                    <Send className="w-6 h-6" />
                  </button>
                </div>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setIsSaved(!isSaved)}
                  className={`transition-colors ${isSaved ? 'text-gray-900' : 'text-gray-700 hover:text-gray-500'}`}
                >
                  <Bookmark 
                    className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} 
                  />
                </motion.button>
              </div>
              
              {/* Likes count */}
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {mockLikes.toLocaleString()}いいね!
                </p>
              </div>
            </div>
          )}
          
          {/* Caption */}
          <div className="px-3 pb-3">
            {(caption || hashtags.length > 0) && (
              <div className="space-y-2">
                {caption && (
                  <p className="text-sm">
                    <span className="font-semibold text-gray-900">{username}</span>
                    {' '}
                    <span className="text-gray-900">
                      {displayCaption}
                      {caption.length > 125 && !showFullCaption && (
                        <button
                          onClick={() => setShowFullCaption(true)}
                          className="text-gray-500 ml-1 hover:text-gray-700"
                        >
                          もっと見る
                        </button>
                      )}
                    </span>
                  </p>
                )}
                
                {hashtags.length > 0 && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-blue-900 font-normal"
                  >
                    {formatHashtags(hashtags)}
                  </motion.p>
                )}
              </div>
            )}
            
            {/* Comments preview */}
            {showEngagement && mockComments > 0 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-500 mt-2 hover:text-gray-700 transition-colors"
              >
                コメント{mockComments}件をすべて表示
              </motion.button>
            )}
            
            {/* Time */}
            <p className="text-xs text-gray-400 uppercase tracking-wide mt-2">
              1分前
            </p>
          </div>
        </div>
      </div>

      {/* Character Count */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            文字数: {caption.length + (hashtags.length > 0 ? ' + ' + formatHashtags(hashtags).length + ' (ハッシュタグ)' : '')}
          </span>
          <span className={`font-medium ${
            (caption.length + formatHashtags(hashtags).length) > 2200 
              ? 'text-red-500' 
              : 'text-green-500'
          }`}>
            {2200 - (caption.length + formatHashtags(hashtags).length)} 文字残り
          </span>
        </div>
        
        {/* Character count bar */}
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <motion.div 
            className={`h-2 rounded-full transition-all duration-300 ${
              (caption.length + formatHashtags(hashtags).length) > 2200 
                ? 'bg-red-500' 
                : (caption.length + formatHashtags(hashtags).length) > 1800
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            initial={{ width: 0 }}
            animate={{ 
              width: `${Math.min(((caption.length + formatHashtags(hashtags).length) / 2200) * 100, 100)}%` 
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default InstagramPreview;
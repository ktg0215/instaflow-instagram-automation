'use client';

import React, { useState, useEffect } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  className = ''
}) => {
  const controls = useAnimation();
  const [isDragging, setIsDragging] = useState(false);

  const handlePan = (event: any, info: PanInfo) => {
    setIsDragging(true);
  };

  const handlePanEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);
    
    if (Math.abs(info.offset.x) > 100) {
      if (info.offset.x > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (info.offset.x < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    
    controls.start({ x: 0, opacity: 1 });
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onPan={handlePan}
      onPanEnd={handlePanEnd}
      animate={controls}
      className={`${className} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      whileDrag={{ scale: 1.02, opacity: 0.95 }}
    >
      {children}
    </motion.div>
  );
};

interface TouchFriendlyButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  'aria-label'?: string;
}

export const TouchFriendlyButton: React.FC<TouchFriendlyButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  'aria-label': ariaLabel,
  ...props
}) => {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 focus:ring-red-500'
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm min-h-[40px]',
    md: 'px-6 py-3 text-base min-h-[44px]',
    lg: 'px-8 py-4 text-lg min-h-[48px]'
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      aria-label={ariaLabel}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
          処理中...
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
};

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  height?: 'half' | 'full' | 'auto';
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  height = 'auto'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    if (isOpen) {
      controls.start({ y: 0 });
      document.body.style.overflow = 'hidden';
    } else {
      controls.start({ y: '100%' });
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, controls]);

  const handlePanEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);
    
    if (info.offset.y > 100) {
      onClose();
    } else {
      controls.start({ y: 0 });
    }
  };

  const heightClasses = {
    half: 'h-1/2',
    full: 'h-full',
    auto: 'max-h-[80vh]'
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        onPanEnd={handlePanEnd}
        animate={controls}
        initial={{ y: '100%' }}
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 ${heightClasses[height]} overflow-hidden shadow-2xl`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>
        
        {/* Header */}
        {title && (
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 text-center">{title}</h3>
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </motion.div>
    </>
  );
};

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const controls = useAnimation();

  const handlePanStart = () => {
    if (window.scrollY === 0) {
      setPullDistance(0);
    }
  };

  const handlePan = (event: any, info: PanInfo) => {
    if (window.scrollY === 0 && info.offset.y > 0) {
      setPullDistance(Math.min(info.offset.y, threshold * 1.5));
    }
  };

  const handlePanEnd = async (event: any, info: PanInfo) => {
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    
    setPullDistance(0);
    controls.start({ y: 0 });
  };

  const pullProgress = Math.min(pullDistance / threshold, 1);

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      onPanStart={handlePanStart}
      onPan={handlePan}
      onPanEnd={handlePanEnd}
      animate={controls}
      className="relative"
    >
      {/* Pull indicator */}
      {pullDistance > 0 && (
        <motion.div
          className="absolute top-0 left-0 right-0 flex items-center justify-center py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: pullProgress }}
          style={{ transform: `translateY(-${Math.max(0, 50 - pullDistance)}px)` }}
        >
          <div className={`w-8 h-8 border-2 border-gray-300 rounded-full flex items-center justify-center ${
            isRefreshing ? 'animate-spin' : ''
          }`}>
            <div 
              className="w-6 h-6 bg-blue-500 rounded-full origin-bottom"
              style={{ 
                transform: `scaleY(${pullProgress})`,
                opacity: pullProgress 
              }}
            />
          </div>
          <span className="ml-2 text-sm text-gray-600">
            {isRefreshing ? '更新中...' : pullDistance >= threshold ? '離して更新' : '引っ張って更新'}
          </span>
        </motion.div>
      )}
      
      <div style={{ transform: `translateY(${pullDistance * 0.5}px)` }}>
        {children}
      </div>
    </motion.div>
  );
};

// Hook for detecting mobile device
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return isMobile;
};

// Hook for managing touch gestures
export const useTouchGestures = () => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > 50;
    const isRightSwipe = distanceX < -50;
    const isUpSwipe = distanceY > 50;
    const isDownSwipe = distanceY < -50;

    return {
      isLeftSwipe,
      isRightSwipe,
      isUpSwipe,
      isDownSwipe,
      distanceX,
      distanceY,
    };
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
};

export default {
  SwipeableCard,
  TouchFriendlyButton,
  BottomSheet,
  PullToRefresh,
  useIsMobile,
  useTouchGestures
};
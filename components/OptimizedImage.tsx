'use client'

import React, { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ImageIcon, Loader2 } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  fill = false,
  style,
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  React.useEffect(() => {
    if (priority) return; // Skip if priority loading

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  // Generate optimized sizes string based on container
  const defaultSizes = sizes || (
    fill 
      ? '100vw'
      : width 
        ? `(max-width: 768px) ${Math.min(width, 640)}px, ${width}px`
        : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
  );

  // Generate blur placeholder if not provided
  const generateBlurDataURL = (w: number = 10, h: number = 10) => {
    return `data:image/svg+xml;base64,${Buffer.from(
      `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <rect x="25%" y="25%" width="50%" height="50%" fill="#e5e7eb" rx="4"/>
      </svg>`
    ).toString('base64')}`;
  };

  const defaultBlurDataURL = blurDataURL || generateBlurDataURL(width, height);

  if (hasError) {
    return (
      <div 
        ref={imgRef}
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="flex flex-col items-center text-gray-500">
          <ImageIcon className="w-8 h-8 mb-2" />
          <span className="text-sm">画像の読み込みに失敗しました</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={imgRef} 
      className={`relative overflow-hidden ${className}`}
      style={fill ? undefined : { width, height, ...style }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
      )}
      
      {(isIntersecting || priority) && (
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={placeholder === 'blur' ? defaultBlurDataURL : undefined}
          sizes={defaultSizes}
          className={`transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          style={fill ? { objectFit: 'cover', ...style } : style}
          onLoad={handleLoad}
          onError={handleError}
          quality={85}
        />
      )}
    </div>
  );
};

export default OptimizedImage;
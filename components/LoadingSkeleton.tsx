'use client'

import React from 'react'

interface LoadingSkeletonProps {
  type?: 'dashboard' | 'analytics' | 'create' | 'settings' | 'schedule' | 'ai'
  className?: string
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'dashboard', className = '' }) => {
  const baseClass = `animate-pulse ${className}`

  switch (type) {
    case 'dashboard':
      return (
        <div className={`space-y-6 ${baseClass}`}>
          {/* Welcome Section Skeleton */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-xl"></div>
                  <div className="h-5 w-12 sm:h-6 sm:w-16 bg-gray-200 rounded-full"></div>
                </div>
                <div className="h-6 sm:h-8 bg-gray-200 rounded w-14 sm:w-16 mb-1"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-16 sm:w-20"></div>
              </div>
            ))}
          </div>

          {/* Content Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )

    case 'analytics':
      return (
        <div className={`space-y-6 ${baseClass}`}>
          {/* Header */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="h-10 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )

    case 'create':
      return (
        <div className={`max-w-6xl mx-auto space-y-6 ${baseClass}`}>
          <div className="bg-white rounded-xl shadow-lg border">
            <div className="p-6 border-b">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Media Upload Skeleton */}
                <div className="space-y-6">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-64 bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
                    ))}
                  </div>
                </div>

                {/* Caption Skeleton */}
                <div className="space-y-6">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-32 bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-8 bg-gray-200 rounded"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>

                {/* Preview Skeleton */}
                <div className="space-y-6">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="bg-black rounded-lg p-4 max-w-sm mx-auto">
                      <div className="bg-white rounded-lg overflow-hidden">
                        <div className="flex items-center p-3 border-b">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="ml-3 flex-1">
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                          </div>
                        </div>
                        <div className="aspect-square bg-gray-200"></div>
                        <div className="p-3">
                          <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )

    default:
      return (
        <div className={`space-y-6 ${baseClass}`}>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
  }
}

export default LoadingSkeleton
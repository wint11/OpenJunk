"use client"

import { useState, useEffect } from 'react'
import { getTimeBasedBanner, getBannerUrl, type BannerImage } from '@/config/ppt-contest-banners'

interface ContestBannerProps {
  className?: string
  priority?: boolean
}

export function ContestBanner({ className = '', priority = false }: ContestBannerProps) {
  const [banner, setBanner] = useState<BannerImage | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 在客户端获取基于时间的横幅（与服务器端相同）
    const timeBanner = getTimeBasedBanner()
    setBanner(timeBanner)
    setIsLoading(false)
  }, [])

  // 使用基于时间的横幅（服务器端和客户端一致）
  const displayBanner = banner || getTimeBasedBanner()
  const bannerUrl = getBannerUrl(displayBanner)

  return (
    <div className={`flex justify-center items-center h-32 ${className}`}>
      <div className="relative h-full" style={{ maxWidth: '800px' }}>
        {/* 使用普通img标签避免Next.js Image组件的问题 */}
        <img
          src={bannerUrl}
          alt={displayBanner.alt}
          className="h-full w-auto max-h-32 object-contain"
          loading={priority ? "eager" : "lazy"}
          onError={(e) => {
            console.error('图片加载失败:', bannerUrl, e);
            // 尝试使用原始文件名作为备选
            const fallbackUrl = `/images/ppt-contest-banners/${displayBanner.filename}`;
            if (e.currentTarget.src !== fallbackUrl) {
              e.currentTarget.src = fallbackUrl;
            }
          }}
          onLoad={() => {
            console.log('图片加载成功:', displayBanner.filename);
          }}
        />
        
        {/* 加载状态覆盖层 */}
        {isLoading && (
          <div className="absolute inset-0 flex justify-center items-center bg-background/50 backdrop-blur-sm rounded-lg">
            <div className="text-muted-foreground animate-pulse">加载中...</div>
          </div>
        )}
      </div>
    </div>
  )
}
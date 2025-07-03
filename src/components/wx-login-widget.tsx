'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    WxLogin: any
  }
}

interface WxLoginWidgetProps {
  onSuccess?: () => void
}

export function WxLoginWidget({ onSuccess }: WxLoginWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isWxAvailable, setIsWxAvailable] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkWxLogin = () => {
      if (typeof window !== 'undefined' && window.WxLogin) {
        setIsWxAvailable(true)
        initWxLogin()
      } else {
        // Retry after a short delay
        setTimeout(checkWxLogin, 100)
      }
    }

    const initWxLogin = () => {
      if (!containerRef.current || !window.WxLogin) return

      try {
        // Generate unique state for CSRF protection
        const state = crypto.randomUUID()
        sessionStorage.setItem('wx_login_state', state)

        new window.WxLogin({
          id: containerRef.current.id,
          appid: process.env.NEXT_PUBLIC_WX_APP_ID || 'wx04971a76992f4fd0',
          scope: 'snsapi_login',
          redirect_uri: encodeURIComponent(
            `${window.location.origin}/auth/wechat/callback`
          ),
          state: state,
          stylelite: '1', // New UI style
          fast_login: '1' // Allow fast login for desktop WeChat
        })
      } catch (err) {
        console.error('WeChat login initialization failed:', err)
        setError('微信登录组件初始化失败')
      }
    }

    checkWxLogin()
  }, [])

  // Check if running on desktop and WeChat is available
  const canUseFastLogin = () => {
    if (typeof navigator === 'undefined') return false
    const userAgent = navigator.userAgent.toLowerCase()
    const isDesktop = !userAgent.includes('mobile') && !userAgent.includes('tablet')
    // Check if WeChat desktop is installed (this is a simplified check)
    return isDesktop
  }

  if (error) {
    return (
      <div className="w-full p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="text-red-700 text-sm">{error}</div>
        <div className="text-red-600 text-xs mt-1">
          请确保网络连接正常，或尝试刷新页面
        </div>
      </div>
    )
  }

  if (!isWxAvailable) {
    return (
      <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-md">
        <div className="text-gray-600 text-sm">正在加载微信登录...</div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-3 text-center">
        <div className="text-sm text-gray-600">
          {canUseFastLogin() ? '扫码登录 / 快捷登录' : '扫码登录'}
        </div>
        {canUseFastLogin() && (
          <div className="text-xs text-gray-500 mt-1">
            已安装微信桌面版可使用快捷登录
          </div>
        )}
      </div>
      <div
        ref={containerRef}
        id={`wx_qr_container_${Date.now()}`}
        className="flex justify-center"
        style={{ minHeight: '280px' }}
      />
    </div>
  )
}
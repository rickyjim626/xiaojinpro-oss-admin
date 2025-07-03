'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'

function WeChatCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { clearError } = useAuthStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        // Check for OAuth errors
        if (error) {
          throw new Error(errorDescription || error)
        }

        if (!code) {
          throw new Error('未获取到授权码')
        }

        // Verify state parameter for CSRF protection
        const storedState = sessionStorage.getItem('wx_login_state')
        if (!storedState || storedState !== state) {
          throw new Error('状态验证失败，请重新登录')
        }

        // Remove stored state
        sessionStorage.removeItem('wx_login_state')

        setMessage('正在验证微信授权...')

        // Call backend to exchange code for token
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oss.xiaojinpro.com'}/auth/wechat/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, state }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.detail || '微信登录验证失败')
        }

        const data = await response.json()
        
        if (!data.access_token) {
          throw new Error('未获取到访问令牌')
        }

        // Store token
        localStorage.setItem('XJP_TOKEN', data.access_token)
        
        setStatus('success')
        setMessage('登录成功，正在跳转...')
        
        // Clear any previous auth errors
        clearError()
        
        // Redirect to home page
        setTimeout(() => {
          router.replace('/')
        }, 1500)

      } catch (err: any) {
        console.error('WeChat callback error:', err)
        setStatus('error')
        setMessage(err.message || '微信登录失败')
        
        // Redirect back to login page after delay
        setTimeout(() => {
          router.replace('/')
        }, 3000)
      }
    }

    handleCallback()
  }, [searchParams, router, clearError])

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-stone-800">
            微信登录
          </h2>
        </div>

        {status === 'loading' && (
          <div className="space-y-4">
            <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-stone-600">{message || '正在处理微信登录...'}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-700 font-medium">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-700 font-medium">{message}</p>
            <p className="text-stone-500 text-sm">
              3秒后自动返回登录页面...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function WeChatCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-stone-600 mt-4">正在加载...</p>
        </div>
      </div>
    }>
      <WeChatCallbackContent />
    </Suspense>
  )
}
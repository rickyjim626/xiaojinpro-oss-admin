'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { auth } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import { WxLoginWidget } from '@/components/wx-login-widget'

interface LoginPageProps {
  onLoginSuccess: () => void
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [loginMode, setLoginMode] = useState<'credentials' | 'token' | 'wechat'>('credentials')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  
  const { login, isLoading, error, clearError } = useAuthStore()

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    try {
      await login(username, password)
      onLoginSuccess()
    } catch (err) {
      // Error is handled by the store
    }
  }

  const handleTokenLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    try {
      const isValid = await auth.verifyToken(token)
      if (isValid) {
        localStorage.setItem('XJP_TOKEN', token)
        onLoginSuccess()
      } else {
        console.error('Token verification failed')
      }
    } catch (err) {
      console.error('Token login error:', err)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-3xl font-bold text-center text-stone-800">
            OSS File Manager
          </h2>
          <p className="mt-2 text-center text-stone-600">
            Sign in to access your files
          </p>
        </div>

        {/* Login Mode Toggle */}
        <div className="flex rounded-lg bg-stone-100 p-1">
          <button
            onClick={() => setLoginMode('credentials')}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors ${
              loginMode === 'credentials'
                ? 'bg-white text-stone-800 shadow-sm'
                : 'text-stone-600 hover:text-stone-800'
            }`}
          >
            用户名/密码
          </button>
          <button
            onClick={() => setLoginMode('token')}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors ${
              loginMode === 'token'
                ? 'bg-white text-stone-800 shadow-sm'
                : 'text-stone-600 hover:text-stone-800'
            }`}
          >
            Bearer Token
          </button>
          <button
            onClick={() => setLoginMode('wechat')}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-colors ${
              loginMode === 'wechat'
                ? 'bg-white text-stone-800 shadow-sm'
                : 'text-stone-600 hover:text-stone-800'
            }`}
          >
            微信登录
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {loginMode === 'credentials' ? (
          <form onSubmit={handleCredentialsLogin} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-stone-700">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-1"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
                placeholder="Enter your password"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-stone-800 hover:bg-stone-900"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        ) : loginMode === 'token' ? (
          <form onSubmit={handleTokenLogin} className="space-y-6">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-stone-700">
                Bearer Token
              </label>
              <Input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="mt-1"
                placeholder="Enter your bearer token"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-stone-800 hover:bg-stone-900"
            >
              {isLoading ? 'Verifying...' : 'Verify Token'}
            </Button>
          </form>
        ) : (
          <div className="space-y-6">
            <WxLoginWidget onSuccess={onLoginSuccess} />
          </div>
        )}
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { auth } from '@/lib/api'

interface LoginPageProps {
  onLoginSuccess: () => void
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [loginMode, setLoginMode] = useState<'credentials' | 'token'>('credentials')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await auth.login(username, password)
      onLoginSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTokenLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const isValid = await auth.verifyToken(token)
      if (isValid) {
        localStorage.setItem('XJP_TOKEN', token)
        onLoginSuccess()
      } else {
        setError('Invalid token')
      }
    } catch (err) {
      setError('Token verification failed')
    } finally {
      setIsLoading(false)
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
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              loginMode === 'credentials'
                ? 'bg-white text-stone-800 shadow-sm'
                : 'text-stone-600 hover:text-stone-800'
            }`}
          >
            Username/Password
          </button>
          <button
            onClick={() => setLoginMode('token')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              loginMode === 'token'
                ? 'bg-white text-stone-800 shadow-sm'
                : 'text-stone-600 hover:text-stone-800'
            }`}
          >
            Bearer Token
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
        ) : (
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
        )}
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import LoginPage from '@/components/login-page'
import FileAdmin from '@/components/file-admin'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { auth } from '@/lib/api'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = auth.getToken()
      if (token) {
        try {
          const isValid = await auth.verifyToken(token)
          setIsAuthenticated(isValid)
        } catch {
          setIsAuthenticated(false)
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-stone-600">Loading...</div>
      </div>
    )
  }

  return (
    <>
      {isAuthenticated ? (
        <AuthenticatedLayout onLogout={handleLogout}>
          <FileAdmin onLogout={handleLogout} />
        </AuthenticatedLayout>
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  )
}
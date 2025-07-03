import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { auth, UserResponse } from './api'

interface AuthState {
  user: UserResponse | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          await auth.login(username, password)
          const user = await auth.getCurrentUser()
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          })
        } catch (error: any) {
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || 'Login failed'
          })
          throw error
        }
      },

      logout: () => {
        auth.logout()
        set({ 
          user: null,
          isAuthenticated: false,
          error: null
        })
      },

      checkAuth: async () => {
        const token = auth.getToken()
        
        if (!token) {
          set({ user: null, isAuthenticated: false })
          return
        }

        set({ isLoading: true })
        
        try {
          const user = await auth.getCurrentUser()
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null
          })
        } catch (error) {
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          })
          auth.logout()
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
)
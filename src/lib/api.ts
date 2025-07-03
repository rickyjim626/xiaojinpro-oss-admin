import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { jwtDecode } from 'jwt-decode'
import pLimit from 'p-limit'

// Types
interface FileResponse {
  id: number
  filename: string
  original_filename: string
  content_type: string
  file_size: number
  oss_key: string
  oss_url: string
  description?: string | null
  tags?: string | null
  created_at: string
  updated_at: string
  upload_id?: string | null
  part_count?: number | null
  completed?: boolean
}

interface SmartUploadRequest {
  filename: string
  original_filename: string
  content_type: string
  file_size: number
  description?: string
  tags?: string
}

interface SmartUploadResponse {
  upload_type: 'single' | 'multipart'
  // For single upload
  oss_key?: string
  upload_url?: string
  // For multipart upload
  upload_id?: string
  part_size?: number
  total_parts?: number
  part_urls?: Array<{
    part_number: number
    upload_url: string
    part_size: number
  }>
  file_id?: number
}

interface MultipartCompleteRequest {
  parts: Array<{
    part_number: number
    etag: string
  }>
}

interface MultipartUploadProgress {
  upload_id: string
  file_id: number
  filename: string
  file_size: number
  completed_parts: number
  total_parts: number
  percentage: number
  uploaded_size: number
  uploaded_parts: Array<{
    part_number: number
    etag: string
    size: number
    last_modified: string
  }>
}

interface FileUpdate {
  filename?: string | null
  description?: string | null
  tags?: string | null
}

interface UserResponse {
  username: string
  email?: string | null
  full_name?: string | null
  id: number
  created_at: string
  is_active: boolean
}

interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface JWTPayload {
  sub: string
  exp: number
  iat: number
}

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean
}

// Auth store and refresh logic
let authStore: {
  token: string | null
  refreshTimeout: NodeJS.Timeout | null
} = {
  token: null,
  refreshTimeout: null
}

// Refresh mutex - only allow one refresh at a time
const refreshLimit = pLimit(1)
let isRefreshing = false

class ApiClient {
  private client: AxiosInstance
  private baseURL: string

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'https://oss.xiaojinpro.com') {
    this.baseURL = baseURL
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
    })

    this.setupInterceptors()
    this.initializeAuth()
  }

  private initializeAuth() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('XJP_TOKEN')
      if (token) {
        authStore.token = token
        this.scheduleRefresh(token)
      }
    }
  }

  private setupInterceptors() {
    // Request interceptor to add auth header
    this.client.interceptors.request.use(
      (config) => {
        const token = authStore.token || (typeof window !== 'undefined' ? localStorage.getItem('XJP_TOKEN') : null)
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for 401 handling and auto-retry
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config as CustomAxiosRequestConfig

        // Handle 401 errors with automatic token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            await this.refreshTokenOnce()
            // Retry the original request with new token
            return this.client(originalRequest)
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.handleAuthFailure()
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  private async refreshTokenOnce() {
    return refreshLimit(async () => {
      if (isRefreshing) {
        // Wait for ongoing refresh to complete
        while (isRefreshing) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        return
      }

      isRefreshing = true
      
      try {
        const currentToken = authStore.token || (typeof window !== 'undefined' ? localStorage.getItem('XJP_TOKEN') : null)
        if (!currentToken) {
          throw new Error('No token available for refresh')
        }

        // Call refresh endpoint
        const response = await axios.post(`${this.baseURL}/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${currentToken}` }
        })

        const { access_token, expires_in } = response.data
        
        // Update token in store and localStorage
        authStore.token = access_token
        if (typeof window !== 'undefined') {
          localStorage.setItem('XJP_TOKEN', access_token)
        }

        // Schedule next refresh
        this.scheduleRefresh(access_token)
        
      } finally {
        isRefreshing = false
      }
    })
  }

  private scheduleRefresh(token: string) {
    try {
      // Clear existing timeout
      if (authStore.refreshTimeout) {
        clearTimeout(authStore.refreshTimeout)
      }

      // Decode token to get expiration
      const decoded = jwtDecode<JWTPayload>(token)
      const now = Math.floor(Date.now() / 1000)
      const timeToRefresh = (decoded.exp - now - 60) * 1000 // Refresh 60s before expiry

      if (timeToRefresh > 0) {
        authStore.refreshTimeout = setTimeout(() => {
          this.refreshTokenOnce().catch(() => {
            this.handleAuthFailure()
          })
        }, timeToRefresh)
      }
    } catch (error) {
      console.warn('Failed to schedule token refresh:', error)
    }
  }

  private handleAuthFailure() {
    // Clear token and redirect to login
    authStore.token = null
    if (authStore.refreshTimeout) {
      clearTimeout(authStore.refreshTimeout)
      authStore.refreshTimeout = null
    }
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('XJP_TOKEN')
      window.location.href = '/login'
    }
  }

  // HTTP methods
  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(endpoint, config)
    return response.data
  }

  async post<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(endpoint, data, config)
    return response.data
  }

  async put<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(endpoint, data, config)
    return response.data
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(endpoint, config)
    return response.data
  }

  async upload(endpoint: string, file: File, description?: string, tags?: string): Promise<FileResponse> {
    const formData = new FormData()
    formData.append('file', file)
    if (description) formData.append('description', description)
    if (tags) formData.append('tags', tags)

    const response = await this.client.post<FileResponse>(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }
}

// Create API instance
export const api = new ApiClient()

// Auth functions
export const auth = {
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'https://oss.xiaojinpro.com'}/auth/login`, {
        username,
        password
      })

      const { access_token, token_type, expires_in } = response.data
      
      // Store token
      authStore.token = access_token
      if (typeof window !== 'undefined') {
        localStorage.setItem('XJP_TOKEN', access_token)
      }

      // Schedule automatic refresh
      api['scheduleRefresh'](access_token)

      return { access_token, token_type, expires_in }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Login failed'
      throw new Error(message)
    }
  },

  async refreshToken(): Promise<void> {
    await api['refreshTokenOnce']()
  },

  async verifyToken(token: string): Promise<boolean> {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'https://oss.xiaojinpro.com'}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.status === 200
    } catch {
      return false
    }
  },

  async getCurrentUser(): Promise<UserResponse> {
    return api.get<UserResponse>('/auth/me')
  },

  logout() {
    authStore.token = null
    if (authStore.refreshTimeout) {
      clearTimeout(authStore.refreshTimeout)
      authStore.refreshTimeout = null
    }
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('XJP_TOKEN')
      window.location.href = '/login'
    }
  },

  getToken(): string | null {
    return authStore.token || (typeof window !== 'undefined' ? localStorage.getItem('XJP_TOKEN') : null)
  },

  isAuthenticated(): boolean {
    return !!this.getToken()
  }
}

// File management functions
export const files = {
  async list(skip: number = 0, limit: number = 100): Promise<FileResponse[]> {
    return api.get<FileResponse[]>(`/files/?skip=${skip}&limit=${limit}`)
  },

  async get(fileId: number): Promise<FileResponse> {
    return api.get<FileResponse>(`/files/${fileId}`)
  },

  async update(fileId: number, data: FileUpdate): Promise<FileResponse> {
    return api.put<FileResponse>(`/files/${fileId}`, data)
  },

  async delete(fileId: number): Promise<void> {
    return api.delete(`/files/${fileId}`)
  },

  async upload(file: File, description?: string, tags?: string): Promise<FileResponse> {
    return api.upload('/files/upload', file, description, tags)
  },

  async smartUpload(
    file: File, 
    description?: string, 
    tags?: string,
    onProgress?: (progress: number) => void
  ): Promise<FileResponse> {
    // Step 1: Initiate smart upload
    const uploadRequest: SmartUploadRequest = {
      filename: file.name,
      original_filename: file.name,
      content_type: file.type || 'application/octet-stream',
      file_size: file.size,
      description,
      tags
    }

    const uploadResponse = await api.post<SmartUploadResponse>('/files/smart-upload', uploadRequest)

    if (uploadResponse.upload_type === 'single') {
      // Single file upload using presigned URL
      if (!uploadResponse.upload_url || !uploadResponse.oss_key) {
        throw new Error('Missing upload URL for single upload')
      }

      // Upload directly to OSS
      await axios.put(uploadResponse.upload_url, file, {
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(progress)
          }
        }
      })

      // For single upload, use the traditional upload endpoint with FormData
      // This maintains compatibility with the existing backend
      return this.upload(file, description, tags)

    } else {
      // Multipart upload
      if (!uploadResponse.upload_id || !uploadResponse.part_urls || !uploadResponse.file_id) {
        throw new Error('Missing multipart upload data')
      }

      return this.executeMultipartUpload(
        file, 
        uploadResponse.upload_id, 
        uploadResponse.part_urls, 
        uploadResponse.file_id,
        onProgress
      )
    }
  },

  async executeMultipartUpload(
    file: File,
    uploadId: string,
    partUrls: Array<{ part_number: number; upload_url: string; part_size: number }>,
    fileId: number,
    onProgress?: (progress: number) => void
  ): Promise<FileResponse> {
    const parts: Array<{ part_number: number; etag: string }> = []
    const totalParts = partUrls.length
    let completedParts = 0

    // Upload parts concurrently (max 4 concurrent uploads following Aliyun best practices)
    const concurrencyLimit = pLimit(4)
    
    const uploadPromises = partUrls.map(partInfo => 
      concurrencyLimit(async () => {
        const { part_number, upload_url, part_size } = partInfo
        const start = (part_number - 1) * part_size
        const end = Math.min(start + part_size, file.size)
        const chunk = file.slice(start, end)

        const response = await axios.put(upload_url, chunk, {
          headers: {
            'Content-Type': 'application/octet-stream'
          }
        })

        const etag = response.headers.etag?.replace(/"/g, '') || response.headers.ETag?.replace(/"/g, '')
        if (!etag) {
          throw new Error(`No ETag received for part ${part_number}`)
        }

        parts.push({ part_number, etag })
        completedParts++

        if (onProgress) {
          const progress = Math.round((completedParts / totalParts) * 100)
          onProgress(progress)
        }

        return { part_number, etag }
      })
    )

    // Wait for all parts to upload
    await Promise.all(uploadPromises)

    // Sort parts by part_number for completion
    parts.sort((a, b) => a.part_number - b.part_number)

    // Complete multipart upload
    const completeRequest: MultipartCompleteRequest = { parts }
    await api.post(`/files/multipart/${uploadId}/complete`, completeRequest)

    // Return updated file record
    return api.get<FileResponse>(`/files/${fileId}`)
  },

  async getMultipartProgress(uploadId: string): Promise<MultipartUploadProgress> {
    return api.get<MultipartUploadProgress>(`/files/multipart/${uploadId}/progress`)
  },

  async abortMultipartUpload(uploadId: string): Promise<void> {
    await api.put(`/files/multipart/${uploadId}/abort`)
  }
}

export type { FileResponse, FileUpdate, UserResponse, LoginResponse, SmartUploadRequest, SmartUploadResponse, MultipartUploadProgress }
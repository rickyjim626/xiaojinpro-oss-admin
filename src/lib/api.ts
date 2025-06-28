// Updated to match OpenAPI schema exactly
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
}

interface ApiResponse<T> {
  data: T
  message?: string
}

class ApiClient {
  private baseURL: string
  
  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'https://oss.xiaojinpro.com') {
    this.baseURL = baseURL
  }

  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('XJP_TOKEN') : null
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('XJP_TOKEN')
        window.location.href = '/login'
      }
      throw new Error('Authentication required')
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<T>(response)
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<T>(response)
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  async upload(endpoint: string, file: File, description?: string, tags?: string): Promise<FileResponse> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('XJP_TOKEN') : null
    const formData = new FormData()
    formData.append('file', file)
    if (description) formData.append('description', description)
    if (tags) formData.append('tags', tags)

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: formData,
    })

    return this.handleResponse<FileResponse>(response)
  }
}

export const api = new ApiClient()

// Auth specific functions
export const auth = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://oss.xiaojinpro.com'
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Login failed')
    }

    const data = await response.json()
    if (typeof window !== 'undefined') {
      localStorage.setItem('XJP_TOKEN', data.access_token)
    }
    return data
  },

  async verifyToken(token: string): Promise<boolean> {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://oss.xiaojinpro.com'
      const response = await fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.ok
    } catch {
      return false
    }
  },

  async getCurrentUser() {
    return api.get('/auth/me')
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('XJP_TOKEN')
      window.location.href = '/login'
    }
  },

  getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('XJP_TOKEN') : null
  },

  isAuthenticated() {
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
  }
}

export type { FileResponse, FileUpdate, UserResponse, LoginResponse, ApiResponse }
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { components, operations } from '@/types/api.gen';

// Type definitions from generated API
export type ApiKeyCreateRequest = components['schemas']['ApiKeyCreate'];
export type ApiKeyResponse = components['schemas']['ApiKeyResponse'];
export type ApiKeyCreateResponse = components['schemas']['ApiKeyCreateResponse'];
export type ApiKeyRevoke = components['schemas']['ApiKeyRevoke'];

// API Client class
class ApiClient {
  private instance: AxiosInstance;
  private apiKey: string | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://oss.xiaojinpro.com',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add authentication
    this.instance.interceptors.request.use((config) => {
      // Try JWT token first (from existing auth)
      const token = typeof window !== 'undefined' ? localStorage.getItem('XJP_TOKEN') : null;
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (this.apiKey) {
        // Fallback to API key
        config.headers.Authorization = `ApiKey ${this.apiKey}`;
      }

      return config;
    });

    // Response interceptor for error handling
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - maybe redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('XJP_TOKEN');
            // You might want to redirect to login page here
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Set API key for requests
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Clear API key
  clearApiKey() {
    this.apiKey = null;
  }

  // Generic request method
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.request<T>(config);
    return response.data;
  }

  // API Key management methods
  async createApiKey(data: ApiKeyCreateRequest): Promise<ApiKeyCreateResponse> {
    return this.request<ApiKeyCreateResponse>({
      method: 'POST',
      url: '/api-keys/',
      data,
    });
  }

  async listApiKeys(): Promise<ApiKeyResponse[]> {
    return this.request<ApiKeyResponse[]>({
      method: 'GET',
      url: '/api-keys/',
    });
  }

  async deleteApiKey(keyId: number): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/api-keys/${keyId}`,
    });
  }

  async revokeApiKey(keyId: number, data: ApiKeyRevoke): Promise<ApiKeyResponse> {
    return this.request<ApiKeyResponse>({
      method: 'POST',
      url: `/api-keys/${keyId}/revoke`,
      data,
    });
  }

  // File operations (updated to support API key auth)
  async listFiles(skip = 0, limit = 100): Promise<components['schemas']['FileResponse'][]> {
    return this.request<components['schemas']['FileResponse'][]>({
      method: 'GET',
      url: '/files',
      params: { skip, limit },
    });
  }

  async getFileDownloadUrl(fileId: number, redirect = false): Promise<components['schemas']['DownloadResponse']> {
    return this.request<components['schemas']['DownloadResponse']>({
      method: 'GET',
      url: `/files/${fileId}/download`,
      params: { redirect },
    });
  }

  async getPresignedDownloadUrl(ossKey: string): Promise<components['schemas']['DownloadResponse']> {
    return this.request<components['schemas']['DownloadResponse']>({
      method: 'POST',
      url: '/files/presign/download',
      data: { oss_key: ossKey },
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>({
      method: 'GET',
      url: '/health',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
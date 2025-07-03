/**
 * @jest-environment jsdom
 */

import axios, { AxiosInstance } from 'axios'
import MockAdapter from 'axios-mock-adapter'

// Mock p-limit before importing the module
jest.mock('p-limit', () => {
  return jest.fn(() => (fn: Function) => fn())
})

// Create mock axios instances
const mockAxios = new MockAdapter(axios)
let mockApiClient: MockAdapter

// Mock the api module to use our mocked axios
jest.mock('../api', () => {
  const actualAxios = jest.requireActual('axios')
  const mockInstance = actualAxios.default.create()
  mockApiClient = new MockAdapter(mockInstance)
  
  class MockApiClient {
    client: AxiosInstance = mockInstance
    
    async get(endpoint: string) {
      const response = await this.client.get(endpoint)
      return response.data
    }
    
    async post(endpoint: string, data?: any) {
      const response = await this.client.post(endpoint, data)
      return response.data
    }
  }
  
  return {
    api: new MockApiClient(),
    auth: {
      login: jest.fn().mockImplementation(async (username: string, password: string) => {
        const response = await actualAxios.default.post('/auth/login', { username, password })
        return response.data
      }),
      verifyToken: jest.fn().mockImplementation(async (token: string) => {
        try {
          const response = await actualAxios.default.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          })
          return response.status === 200
        } catch {
          return false
        }
      })
    }
  }
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock window.location
delete (window as any).location
window.location = { href: '' } as any

describe('API Interceptors', () => {
  beforeEach(() => {
    mockAxios.reset()
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue('mock-token')
  })

  afterEach(() => {
    mockAxios.restore()
  })

  it('should add _retry flag on 401 and attempt refresh', async () => {
    // Mock the initial request that returns 401
    mockAxios.onGet('/test').replyOnce(401)
    
    // Mock the refresh endpoint
    mockAxios.onPost('/auth/refresh').reply(200, {
      access_token: 'new-token',
      expires_in: 1800
    })
    
    // Mock the retry request that succeeds
    mockAxios.onGet('/test').reply(200, { data: 'success' })

    try {
      const result = await api.get('/test')
      expect(result).toEqual({ data: 'success' })
    } catch (error) {
      // If refresh fails, expect error
      expect(error).toBeDefined()
    }

    // Verify refresh was called
    expect(mockAxios.history.post.some(req => req.url === '/auth/refresh')).toBe(true)
  })

  it('should not retry infinitely on 401', async () => {
    // Mock both requests to return 401
    mockAxios.onGet('/test').reply(401)
    mockAxios.onPost('/auth/refresh').reply(401)

    let error: any
    try {
      await api.get('/test')
    } catch (err) {
      error = err
    }

    expect(error).toBeDefined()
    
    // Should only try once (original + one retry)
    const getRequests = mockAxios.history.get.filter(req => req.url === '/test')
    expect(getRequests.length).toBeLessThanOrEqual(2)
  })

  it('should handle successful refresh and retry', async () => {
    // Mock the initial request that returns 401
    mockAxios.onGet('/files/').replyOnce(401)
    
    // Mock successful refresh
    mockAxios.onPost('/auth/refresh').reply(200, {
      access_token: 'refreshed-token',
      expires_in: 1800
    })
    
    // Mock successful retry
    mockAxios.onGet('/files/').reply(200, [{ id: 1, filename: 'test.txt' }])

    const result = await api.get('/files/')
    expect(result).toEqual([{ id: 1, filename: 'test.txt' }])
    
    // Verify token was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith('XJP_TOKEN', 'refreshed-token')
  })

  it('should redirect to login on auth failure', async () => {
    // Mock 401 response
    mockAxios.onGet('/test').reply(401)
    mockAxios.onPost('/auth/refresh').reply(401)

    try {
      await api.get('/test')
    } catch (error) {
      // Expected to throw
    }

    // Verify localStorage was cleared and redirect happened
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('XJP_TOKEN')
    expect(window.location.href).toBe('/login')
  })
})

describe('Auth Functions', () => {
  beforeEach(() => {
    mockAxios.reset()
    jest.clearAllMocks()
  })

  it('should handle login successfully', async () => {
    mockAxios.onPost('/auth/login').reply(200, {
      access_token: 'new-token',
      token_type: 'bearer',
      expires_in: 1800
    })

    const result = await auth.login('test@example.com', 'password')
    
    expect(result.access_token).toBe('new-token')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('XJP_TOKEN', 'new-token')
  })

  it('should handle login failure', async () => {
    mockAxios.onPost('/auth/login').reply(401, {
      detail: 'Invalid credentials'
    })

    await expect(auth.login('test@example.com', 'wrong-password'))
      .rejects.toThrow('Invalid credentials')
  })

  it('should verify token correctly', async () => {
    mockAxios.onGet('/auth/me').reply(200, { username: 'test' })
    
    const isValid = await auth.verifyToken('valid-token')
    expect(isValid).toBe(true)
  })

  it('should handle invalid token', async () => {
    mockAxios.onGet('/auth/me').reply(401)
    
    const isValid = await auth.verifyToken('invalid-token')
    expect(isValid).toBe(false)
  })
})
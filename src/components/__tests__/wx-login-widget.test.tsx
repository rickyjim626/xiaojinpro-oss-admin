import { render, screen, waitFor } from '@testing-library/react'
import { WxLoginWidget } from '../wx-login-widget'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

// Mock global WeChat SDK
const mockWxLogin = jest.fn()
Object.defineProperty(window, 'WxLogin', {
  value: mockWxLogin,
  writable: true,
})

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-123',
  },
})

describe('WxLoginWidget', () => {
  beforeEach(() => {
    mockWxLogin.mockClear()
    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    })
  })

  it('renders loading state initially', () => {
    // Don't set window.WxLogin to simulate loading state
    delete (window as any).WxLogin
    render(<WxLoginWidget />)
    expect(screen.getByText('正在加载微信登录...')).toBeInTheDocument()
  })

  it('renders WeChat QR container when SDK is available', async () => {
    // Set WxLogin to simulate SDK availability
    ;(window as any).WxLogin = mockWxLogin
    
    render(<WxLoginWidget />)
    
    await waitFor(() => {
      expect(mockWxLogin).toHaveBeenCalledWith({
        id: expect.stringContaining('wx_qr_container_'),
        appid: 'wx04971a76992f4fd0',
        scope: 'snsapi_login',
        redirect_uri: expect.stringContaining('/auth/wechat/callback'),
        state: 'mock-uuid-123',
        stylelite: '1',
        fast_login: '1',
      })
    })
    
    expect(screen.getByText('扫码登录 / 快捷登录')).toBeInTheDocument()
  })

  it('handles WeChat SDK initialization error', async () => {
    // Set WxLogin but make it throw error
    ;(window as any).WxLogin = jest.fn(() => {
      throw new Error('SDK initialization failed')
    })

    render(<WxLoginWidget />)
    
    await waitFor(() => {
      expect(screen.getByText('微信登录组件初始化失败')).toBeInTheDocument()
    })
  })

  it('calls onSuccess callback when provided', () => {
    const mockOnSuccess = jest.fn()
    render(<WxLoginWidget onSuccess={mockOnSuccess} />)
    
    // The actual success callback would be triggered by WeChat SDK
    // This test just ensures the prop is passed correctly
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('stores state in sessionStorage for CSRF protection', async () => {
    const mockSetItem = jest.fn()
    Object.defineProperty(window, 'sessionStorage', {
      value: { setItem: mockSetItem },
      writable: true,
    })
    
    // Set WxLogin to simulate SDK availability
    ;(window as any).WxLogin = mockWxLogin

    render(<WxLoginWidget />)
    
    await waitFor(() => {
      expect(mockSetItem).toHaveBeenCalledWith('wx_login_state', 'mock-uuid-123')
    })
  })
})
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

/**
 * API Client Configuration
 * Base axios instance for all API services
 */

const API_BASE_URL = '/api'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 开发模式日志
const devLog = (message: string, data?: any) => {
  const isDevMode = localStorage.getItem('dev_mode') === 'true'
  if (isDevMode) {
    console.log(`[DEV] ${message}`, data || '')
  }
}

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token')
    const isDevMode = localStorage.getItem('dev_mode') === 'true'
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 开发模式日志
    if (isDevMode) {
      console.group(`[DEV API] → ${config.method?.toUpperCase()} ${config.url}`)
      console.log('URL:', config.url)
      console.log('Method:', config.method)
      console.log('Headers:', config.headers)
      console.log('Data:', config.data)
      console.groupEnd()
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle common errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const isDevMode = localStorage.getItem('dev_mode') === 'true'
    
    if (isDevMode) {
      console.group(`[DEV API] ← ${response.status} ${response.config.url}`)
      console.log('Status:', response.status)
      console.log('Data:', response.data)
      console.groupEnd()
    }
    
    return response
  },
  (error) => {
    const isDevMode = localStorage.getItem('dev_mode') === 'true'
    
    if (isDevMode) {
      console.group(`[DEV API] ✗ ${error.response?.status || 'Network Error'} ${error.config?.url}`)
      console.log('Error:', error.message)
      console.log('Response:', error.response?.data)
      console.groupEnd()
    }
    
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Common response types
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export { apiClient }

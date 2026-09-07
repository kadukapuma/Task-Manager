import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api

/** Pull the first validation/error message out of an Axios error response. */
export function apiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data
  if (!data) return fallback
  if (data.errors) {
    const first = Object.values(data.errors)[0]
    if (Array.isArray(first)) return first[0]
  }
  return data.message || fallback
}

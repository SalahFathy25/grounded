import axios from 'axios'
import * as mock from './mockServer'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
export const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

const client = axios.create({ baseURL: API_BASE })

client.interceptors.request.use(cfg => {
  const token = localStorage.getItem('sv_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

async function api(method, path, opts = {}) {
  if (USE_MOCK) return mock.handle(method, path, { ...opts, _token: localStorage.getItem('sv_token') })
  try {
    const res = await client.request({ method, url: path, params: opts.params, data: opts.data })
    return res.data
  } catch (err) {
    const message = err.response?.data?.message || err.message || 'Request failed'
    const status = err.response?.status
    throw Object.assign(new Error(message), { status })
  }
}

export const authApi = {
  login: data => api('post', '/auth/login', { data }),
  register: data => api('post', '/auth/register', { data }),
}

export const categoryApi = {
  list: () => api('get', '/categories'),
  create: data => api('post', '/categories', { data }),
  remove: id => api('delete', `/categories/${id}`),
}

export const productApi = {
  list: params => api('get', '/products', { params }),
  get: id => api('get', `/products/${id}`),
  create: data => api('post', '/products', { data }),
  update: (id, data) => api('put', `/products/${id}`, { data }),
  remove: id => api('delete', `/products/${id}`),
}

export const orderApi = {
  create: data => api('post', '/orders', { data }),
  get: id => api('get', `/orders/${id}`),
  mine: () => api('get', '/orders/my-orders'),
  all: () => api('get', '/orders'),
  setStatus: (id, status) => api('patch', `/orders/${id}/status`, { data: { status } }),
  pay: id => api('post', `/orders/${id}/pay`),
  proof: (id, proof) => api('patch', `/orders/${id}/proof`, { data: { proof } }),
}

export const paymentApi = {
  checkout: data => api('post', '/payments/checkout', { data }),
}

export const adminApi = {
  stats: () => api('get', '/admin/stats'),
  reset: scope => api('post', '/admin/reset', { data: { scope } }),
}

export const settingsApi = {
  get: () => api('get', '/settings'),
  update: data => api('put', '/admin/settings', { data }),
}

export const contentApi = {
  get: () => api('get', '/content'),
  update: data => api('put', '/admin/content', { data }),
}
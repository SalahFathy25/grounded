import axios from 'axios'

const envMock = import.meta.env.VITE_USE_MOCK
export const USE_MOCK = import.meta.env.DEV ? envMock !== 'false' : envMock === 'true'
export const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

const client = axios.create({ baseURL: API_BASE, timeout: 15000 })

client.interceptors.request.use(cfg => {
  const token = localStorage.getItem('sv_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('sv_token')
      localStorage.removeItem('sv_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

async function api(method, path, opts = {}) {
  if (USE_MOCK) {
    const mock = await import('./mockServer')
    return mock.handle(method, path, { ...opts, _token: localStorage.getItem('sv_token') })
  }
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
  update: (id, data) => api('put', `/categories/${id}`, { data }),
  remove: id => api('delete', `/categories/${id}`),
}

export const productApi = {
  list: params => api('get', '/products', { params }),
  get: id => api('get', `/products/${id}`),
  create: data => api('post', '/products', { data }),
  update: (id, data) => api('put', `/products/${id}`, { data }),
  remove: id => api('delete', `/products/${id}`),
  deleteMany: ids => api('delete', '/admin/products', { data: { ids } }),
}

export const orderApi = {
  create: data => api('post', '/orders', { data }),
  get: id => api('get', `/orders/${id}`),
  mine: () => api('get', '/orders/my-orders'),
  all: params => api('get', '/orders', { params }),
  setStatus: (id, status) => api('patch', `/orders/${id}/status`, { data: { status } }),
  pay: id => api('post', `/orders/${id}/pay`),
  proof: (id, proof) => api('patch', `/orders/${id}/proof`, { data: { proof } }),
  deleteMany: ids => api('delete', '/admin/orders', { data: { ids } }),
  deleteAll: () => api('delete', '/admin/orders', { data: { all: true } }),
}

export const adminApi = {
  stats: () => api('get', '/admin/stats'),
  reset: () => api('post', '/admin/reset'),
}

export const userApi = {
  list: params => api('get', '/admin/users', { params }),
  create: data => api('post', '/admin/users', { data }),
  update: (id, data) => api('put', `/admin/users/${id}`, { data }),
  remove: id => api('delete', `/admin/users/${id}`),
}

export const logApi = {
  list: params => api('get', '/admin/logs', { params }),
  clear: () => api('delete', '/admin/logs'),
}

export const settingsApi = {
  get: () => api('get', '/settings'),
  update: data => api('put', '/admin/settings', { data }),
}

export const contentApi = {
  get: () => api('get', '/content'),
  update: data => api('put', '/admin/content', { data }),
}
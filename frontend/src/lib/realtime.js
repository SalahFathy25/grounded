import { API_BASE } from './api'

const base = () => (API_BASE.endsWith('/') ? API_BASE : `${API_BASE}/`)

function createConn() {
  const conn = { listeners: new Set(), es: null, retry: null }
  const ensure = () => {
    if (conn.es || !conn.url) return
    conn.es = new EventSource(conn.url)
    conn.es.onmessage = e => {
      if (!e.data || e.data.startsWith(':')) return
      try {
        const data = JSON.parse(e.data)
        conn.listeners.forEach(fn => fn(data))
      } catch { /* ignore malformed frames */ }
    }
    conn.es.onerror = () => {
      if (conn.es) { conn.es.close(); conn.es = null }
      clearTimeout(conn.retry)
      conn.retry = setTimeout(ensure, 4000)
    }
  }
  conn.ensure = ensure
  return conn
}

const adminConn = createConn()
const storeConn = createConn()

function subscribe(conn, url, onEvent) {
  if (!conn.es) {
    if (url) {
      conn.url = url
      conn.ensure()
    } else if (conn.url) {
      conn.ensure()
    }
  }
  conn.listeners.add(onEvent)
  return () => {
    conn.listeners.delete(onEvent)
    if (conn.listeners.size === 0 && conn.es) {
      conn.es.close()
      conn.es = null
    }
  }
}

/** Admin panel events — every resource type, requires an admin token. */
export function subscribeRealtime(onEvent) {
  const token = localStorage.getItem('sv_token')
  if (!token) return () => {}
  return subscribe(adminConn, `${base()}admin/events?token=${encodeURIComponent(token)}`, onEvent)
}

/** Storefront events — public products/categories/settings/content stream. */
export function subscribeStoreEvents(onEvent) {
  return subscribe(storeConn, `${base()}events`, onEvent)
}
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useToast } from './ToastContext'
import { useLang } from './LangContext'
import { useAuth } from './AuthContext'
import { salePrice } from '../lib/format'

const CartContext = createContext(null)
const CART_KEY = 'grounded_cart'
const keyFor = userId => (userId ? `${CART_KEY}_${userId}` : CART_KEY)

function readCart(key) {
  try {
    const items = JSON.parse(localStorage.getItem(key))
    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState(() => readCart(CART_KEY))
  const [open, setOpen] = useState(false)
  const toast = useToast()
  const { t } = useLang()
  const keyRef = useRef(CART_KEY)

  const userKey = user ? keyFor(user.id) : CART_KEY

  useEffect(() => {
    if (keyRef.current === userKey) return
    try { localStorage.setItem(keyRef.current, JSON.stringify(items)) } catch { /* ignore */ }
    keyRef.current = userKey
    setItems(readCart(userKey))
  }, [userKey])

  useEffect(() => {
    try { localStorage.setItem(keyRef.current, JSON.stringify(items)) } catch { /* ignore */ }
  }, [items])

  const close = () => setOpen(false)
  const openCart = () => setOpen(true)

  const addToCart = (product, qty = 1) => {
    const existing = items.find(i => i.product_id === product.id)
    const targetQty = (existing?.quantity || 0) + qty
    if (targetQty > product.stock_quantity) {
      toast.push(t('cart.stockLimit', { n: product.stock_quantity }), 'error')
      return
    }
    if (existing) {
      setItems(items.map(i => i.product_id === product.id ? { ...i, quantity: targetQty } : i))
    } else {
      setItems([...items, {
        product_id: product.id,
        name: product.name,
        price: salePrice(product),
        original_price: Number(product.price),
        discount_percent: product.discount_percent || 0,
        image_url: product.image_url,
        stock_quantity: product.stock_quantity,
        quantity: qty,
      }])
    }
    toast.push(t('cart.added'))
    setOpen(true)
  }

  const updateQty = (productId, qty) => {
    if (qty < 1) return removeItem(productId)
    setItems(items.map(i => {
      if (i.product_id !== productId) return i
      if (qty > i.stock_quantity) {
        toast.push(t('cart.stockLimit', { n: i.stock_quantity }), 'error')
        return i
      }
      return { ...i, quantity: qty }
    }))
  }

  const removeItem = productId => {
    setItems(items.filter(i => i.product_id !== productId))
    toast.push(t('cart.removed'))
  }

  const clear = () => setItems([])

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const count = items.reduce((s, i) => s + i.quantity, 0)

  const value = useMemo(
    () => ({ items, open, close, openCart, addToCart, updateQty, removeItem, clear, subtotal, count }),
    [items, open, subtotal, count]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
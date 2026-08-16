import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useToast } from './ToastContext'
import { useLang } from './LangContext'
import { salePrice } from '../lib/format'

const CartContext = createContext(null)
const CART_KEY = 'grounded_cart'

function readCart() {
  try {
    const items = JSON.parse(localStorage.getItem(CART_KEY))
    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart)
  const [open, setOpen] = useState(false)
  const toast = useToast()
  const { t } = useLang()

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
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
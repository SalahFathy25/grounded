import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import ScrollToTop from './components/ScrollToTop'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import HeroImageTransition from './components/HeroImageTransition'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'

const Products = lazy(() => import('./pages/Products'))
const ProductDetails = lazy(() => import('./pages/ProductDetails'))
const Checkout = lazy(() => import('./pages/Checkout'))
const PayPage = lazy(() => import('./pages/PayPage'))
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'))
const OrderTracking = lazy(() => import('./pages/OrderTracking'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const MyOrders = lazy(() => import('./pages/MyOrders'))
const About = lazy(() => import('./pages/About'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))
const NotFound = lazy(() => import('./pages/NotFound'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))
const AdminCustomize = lazy(() => import('./pages/admin/AdminCustomize'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs'))
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'))

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="size-7 animate-spin text-muted" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}

function PageShell({ children }) {
  const { pathname } = useLocation()
  return (
    <div key={pathname} className="animate-page-in">
      {children}
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <CartDrawer />
        <HeroImageTransition />
        <main className="flex-1">
          <Suspense fallback={<PageLoader />}>
            <PageShell>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetails />} />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pay/:orderId"
                  element={
                    <ProtectedRoute>
                      <PayPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:id"
                  element={
                    <ProtectedRoute>
                      <OrderTracking />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/order-success/:id"
                  element={
                    <ProtectedRoute>
                      <OrderSuccess />
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/about" element={<About />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route
                  path="/my-orders"
                  element={
                    <ProtectedRoute>
                      <MyOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute admin>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route
                    path="users"
                    element={
                      <ProtectedRoute superAdmin>
                        <AdminUsers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="logs"
                    element={
                      <ProtectedRoute superAdmin>
                        <AdminLogs />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="customize" element={<AdminCustomize />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageShell>
          </Suspense>
        </main>
        <Footer />
      </div>
    </>
  )
}

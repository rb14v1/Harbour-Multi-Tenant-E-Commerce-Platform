import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout, RequireCustomer, RequireVendor } from './components/Layouts'
import Landing from './pages/Landing'
import Stores from './pages/Stores'
import { Login, Register, VendorRegister } from './pages/Auth'
import Dashboard from './pages/vendor/Dashboard'
import Products from './pages/vendor/Products'
import Orders from './pages/vendor/Orders'
import Team from './pages/vendor/Team'
import StoreSettings from './pages/vendor/StoreSettings'
import Shop from './pages/store/Shop'
import ProductDetail from './pages/store/ProductDetail'
import Cart from './pages/store/Cart'
import Checkout from './pages/store/Checkout'
import MyOrders from './pages/store/MyOrders'
import Wishlist from './pages/store/Wishlist'
import Addresses from './pages/store/Addresses'
import Notifications from './pages/store/Notifications'
import Profile from './pages/store/Profile'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/stores" element={<Stores />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/vendor" element={<VendorRegister />} />
      </Route>

      <Route path="/app" element={<RequireVendor />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="orders" element={<Orders />} />
        <Route path="team" element={<Team />} />
        <Route path="settings" element={<StoreSettings />} />
      </Route>

      <Route path="/shop" element={<RequireCustomer />}>
        <Route index element={<Shop />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="orders" element={<MyOrders />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="addresses" element={<Addresses />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

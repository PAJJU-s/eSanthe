import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Callback from './Callback';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import AddProduct from './pages/AddProduct';
import Analytics from './pages/Analytics';
import FarmerProfile from './pages/FarmerProfile';
import MyOrders from './pages/MyOrders';
import Profile from './pages/Profile';
import FarmerProductDetail from './pages/FarmerProductDetail';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* P1: Landing Page (Public) */}
          <Route path="/" element={<Landing />} />

          {/* P2: Authentication (Public) */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<Callback />} />

          {/* Shared Auth Pages (P4, P5) */}
          <Route element={<ProtectedRoute />}>
            {/* P4: Crop Marketplace */}
            <Route path="/marketplace" element={<Marketplace />} />

            {/* P5: Product Details */}
            <Route path="/product/:id" element={<ProductDetail />} />
          </Route>

          {/* Customer Pages */}
          <Route element={<ProtectedRoute role="customer" />}>
            {/* P6: Cart & Order Panel */}
            <Route path="/cart" element={<Cart />} />

            {/* P10: My Orders */}
            <Route path="/orders" element={<MyOrders />} />
          </Route>

          {/* Farmer Pages */}
          <Route element={<ProtectedRoute role="farmer" />}>
            {/* P3: Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* P7: Add Product */}
            <Route path="/farmer/add-product" element={<AddProduct />} />

            {/* P8: Analytics */}
            <Route path="/farmer/analytics" element={<Analytics />} />
          </Route>

          {/* Public Farmer Page (P9) */}
          <Route path="/farmer/:id" element={<FarmerProfile />} />

          {/* Existing utility pages kept outside P1-P10 */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route element={<ProtectedRoute role="farmer" />}>
            <Route path="/farmer/product/:id" element={<FarmerProductDetail />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

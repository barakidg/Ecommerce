import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/Layout';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Home from '../features/storefront/pages/Home';
import Login from '../features/auth/components/Login';
import Register from '../features/auth/components/Register';
import Cart from '../features/storefront/pages/Cart';
import SellerApplication from '../features/auth/components/SellerApplication';
import AddProduct from '../features/seller/pages/AddProduct';
import AdminDashboard from '../features/admin/pages/Dashboard';
import DeliveryDashboard from '../features/delivery/pages/DeliveryDashboard';
import SellerLayout from '../features/seller/pages/PortalLayout';
import SellerDashboard from '../features/seller/pages/SellerDashboard';
import SellerOrders from '../features/seller/pages/SellerOrders';
import SellerInventory from '../features/seller/pages/SellerInventory';
import SellerStoreProfile from '../features/seller/pages/SellerStoreProfile';
import CategoriesPage from '../features/storefront/pages/Categories';
import CategoryDiscovery from '../features/storefront/pages/CategoryDiscovery';
import ProductDetail from '../features/storefront/pages/ProductDetails';
import Profile from '../features/account/pages/ProfilePages';
import CheckoutPage from '../features/storefront/pages/Checkout';
import Orders from '../features/storefront/pages/Orders';
import NewReleases from '../features/storefront/pages/NewReleases';
import BestSellers from '../features/storefront/pages/BestSellers';
import Discounts from '../features/storefront/pages/Discounts';
import Searches from '../features/storefront/pages/Searches';
import Wishlist from '../features/storefront/pages/Wishlist';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/apply-to-sell" element={<SellerApplication />} />
        <Route path="/seller-application" element={<Navigate to="/apply-to-sell" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
        <Route path="/seller" element={<SellerLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SellerDashboard />} />
          <Route path="products" element={<SellerInventory />} />
          <Route path="add-product" element={<AddProduct />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="profile" element={<SellerStoreProfile />} />
        </Route>
        <Route path="/*" element={
          <MainLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/category-discovery" element={<CategoryDiscovery />} />
              <Route path="/product/:productId" element={<ProductDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/my-order" element={<Orders />} />
              <Route path="/new-releases" element={<NewReleases />} />
              <Route path="/best-sellers" element={<BestSellers />} />
              <Route path="/discounts" element={<Discounts />} />
              <Route path="/search" element={<Searches />} />
            </Routes>
          </MainLayout>} />
      </Routes>
    </Router>
  );
}

export default App;

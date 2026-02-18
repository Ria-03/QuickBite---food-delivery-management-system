import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import { AddressProvider } from './context/AddressContext';

// Lazy Load Pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Home = lazy(() => import('./pages/Home'));
const RestaurantDetails = lazy(() => import('./pages/RestaurantDetails'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const RestaurantDashboard = lazy(() => import('./pages/RestaurantDashboard'));
const DeliveryDashboard = lazy(() => import('./pages/DeliveryDashboard'));
const DeliveryLogin = lazy(() => import('./pages/DeliveryLogin'));
const DeliveryOrderDetails = lazy(() => import('./pages/DeliveryOrderDetails'));
const DeliveryProfile = lazy(() => import('./pages/DeliveryProfile'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const Orders = lazy(() => import('./pages/Orders'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Profile = lazy(() => import('./pages/Profile'));
const AddressManager = lazy(() => import('./pages/AddressManager'));
const ScheduledOrders = lazy(() => import('./pages/ScheduledOrders'));
const InventoryDashboard = lazy(() => import('./pages/InventoryDashboard'));
const History = lazy(() => import('./pages/History'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const CustomerHome = lazy(() => import('./pages/CustomerHome'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// Components that shouldn't be lazy loaded (critical UI or small components)
import DeliveryMap from './components/DeliveryMap'; // Keep critical components static if needed, or lazy load if large
import CartConflictModal from './components/CartConflictModal';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <AddressProvider>

            <div className="app-container">
              <CartConflictModal />
              <Suspense fallback={
                <div className="loading-container">
                  <div className="spinner"></div>
                </div>
              }>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/delivery/login" element={<DeliveryLogin />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  <Route path="/register" element={<Register />} />

                  {/* Protected Customer Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['customer', 'restaurant']} />}>
                    <Route path="/customer/home" element={<CustomerHome />} />
                    <Route path="/restaurant/:id" element={<RestaurantDetails />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/track-order" element={<TrackOrder />} />
                    <Route path="/order/:id" element={<OrderTracking />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/addresses" element={<AddressManager />} />
                    <Route path="/scheduled-orders" element={<ScheduledOrders />} />
                  </Route>

                  {/* Protected Admin Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  </Route>

                  {/* Protected Restaurant Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['restaurant']} />}>
                    <Route path="/restaurant/dashboard" element={<RestaurantDashboard />} />
                    <Route path="/restaurant/inventory" element={<InventoryDashboard />} />
                  </Route>

                  {/* Protected Delivery Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['delivery']} />}>
                    <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
                    <Route path="/delivery/map" element={<DeliveryMap />} />
                    <Route path="/delivery/profile" element={<DeliveryProfile />} />
                    <Route path="/delivery/orders/:id" element={<DeliveryOrderDetails />} />
                  </Route>

                </Routes>
              </Suspense>
            </div>
          </AddressProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;

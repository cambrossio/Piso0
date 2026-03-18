import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import AdminProductos from './pages/AdminProductos';
import AdminMesas from './pages/AdminMesas';
import AdminPedidos from './pages/AdminPedidos';
import AdminContabilidad from './pages/AdminContabilidad';
import ClienteMenu from './pages/ClienteMenu';
import ClientePedido from './pages/ClientePedido';
import ClientePago from './pages/ClientePago';
import QRScanner from './pages/QRScanner';
import PagoExitoso from './pages/PagoExitoso';
import PagoFallido from './pages/PagoFallido';
import PagoPendiente from './pages/PagoPendiente';
import SeleccionarModo from './pages/SeleccionarModo';
import MenuDelivery from './pages/MenuDelivery';
import DeliveryPago from './pages/DeliveryPago';
import DeliveryConfirmar from './pages/DeliveryConfirmar';
import DeliveryExitoso from './pages/DeliveryExitoso';
import DeliveryCallback from './pages/DeliveryCallback';

function ProtectedRoute({ children, adminOnly = false }) {
  const { usuario, loading } = useAuth();

  if (loading) {
    return <div className="container">Cargando...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && usuario.rol !== 'admin') {
    return <Navigate to="/menu" />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/productos" element={
              <ProtectedRoute adminOnly>
                <AdminProductos />
              </ProtectedRoute>
            } />
            <Route path="/admin/mesas" element={
              <ProtectedRoute adminOnly>
                <AdminMesas />
              </ProtectedRoute>
            } />
            <Route path="/admin/pedidos" element={
              <ProtectedRoute adminOnly>
                <AdminPedidos />
              </ProtectedRoute>
            } />
            <Route path="/admin/contabilidad" element={
              <ProtectedRoute adminOnly>
                <AdminContabilidad />
              </ProtectedRoute>
            } />
            <Route path="/scan" element={
              <ProtectedRoute>
                <QRScanner />
              </ProtectedRoute>
            } />
            <Route path="/mesa/:codigoQR" element={
              <ProtectedRoute>
                <ClienteMenu />
              </ProtectedRoute>
            } />
            <Route path="/pedido" element={
              <ProtectedRoute>
                <ClientePedido />
              </ProtectedRoute>
            } />
            <Route path="/pago" element={
              <ProtectedRoute>
                <ClientePago />
              </ProtectedRoute>
            } />
            <Route path="/pago-exitoso" element={<PagoExitoso />} />
            <Route path="/pago-fallido" element={<PagoFallido />} />
            <Route path="/pago-pendiente" element={<PagoPendiente />} />
            <Route path="/seleccionar-modo" element={
              <ProtectedRoute>
                <SeleccionarModo />
              </ProtectedRoute>
            } />
            <Route path="/menu-delivery" element={
              <ProtectedRoute>
                <MenuDelivery />
              </ProtectedRoute>
            } />
            <Route path="/delivery-pago" element={
              <ProtectedRoute>
                <DeliveryPago />
              </ProtectedRoute>
            } />
            <Route path="/delivery-confirmar" element={
              <ProtectedRoute>
                <DeliveryConfirmar />
              </ProtectedRoute>
            } />
            <Route path="/delivery-exitoso" element={<DeliveryExitoso />} />
            <Route path="/delivery-callback" element={<DeliveryCallback />} />
            <Route path="/menu" element={
              <ProtectedRoute>
                <Navigate to="/scan" />
              </ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

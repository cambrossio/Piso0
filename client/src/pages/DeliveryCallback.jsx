import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

export default function DeliveryCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');

  useEffect(() => {
    const procesarPago = async () => {
      if (status === 'failed') {
        localStorage.removeItem('pagoPendienteDelivery');
        localStorage.removeItem('carritoDelivery');
        localStorage.removeItem('deliveryInfo');
        localStorage.removeItem('modoPedido');
        setError('El pago fue rechazado.');
        setLoading(false);
        return;
      }

      if (status === 'pending') {
        localStorage.removeItem('pagoPendienteDelivery');
        localStorage.removeItem('carritoDelivery');
        localStorage.removeItem('deliveryInfo');
        localStorage.removeItem('modoPedido');
        setError('El pago está pendiente de confirmación.');
        setLoading(false);
        return;
      }

      const pagoData = localStorage.getItem('pagoPendienteDelivery');
      
      if (!pagoData) {
        navigate('/menu-delivery');
        return;
      }

      const { carrito, deliveryInfo, total } = JSON.parse(pagoData);

      try {
        await api.post('/pedidos/delivery', {
          items: carrito,
          deliveryInfo,
          tipoPago: 'mercadopago',
          total,
          crearTransaccion: true,
          estado: 'preparando'
        });

        localStorage.removeItem('pagoPendienteDelivery');
        localStorage.removeItem('carritoDelivery');
        localStorage.removeItem('deliveryInfo');
        localStorage.removeItem('modoPedido');

        navigate('/delivery-exitoso');
      } catch (err) {
        console.error('Error al confirmar delivery:', err);
        setError(err.response?.data?.error || 'Error al confirmar el pedido');
        setLoading(false);
      }
    };

    procesarPago();
  }, [navigate, status]);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Procesando tu pago...</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Por favor esperá mientras confirmamos tu pedido
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Error</h2>
        <p style={{ color: 'var(--error)' }}>{error}</p>
        <button 
          onClick={() => navigate('/menu-delivery')} 
          className="btn btn-primary" 
          style={{ marginTop: '20px' }}
        >
          Volver al menú
        </button>
      </div>
    );
  }

  return null;
}

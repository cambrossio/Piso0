import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function DeliveryPago() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const deliveryInfo = JSON.parse(localStorage.getItem('deliveryInfo') || '{}');
  const carrito = JSON.parse(localStorage.getItem('carritoDelivery') || '[]');

  const total = carrito.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);

  useEffect(() => {
    if (carrito.length === 0) {
      navigate('/menu-delivery');
      return;
    }

    const iniciarPago = async () => {
      try {
        const response = await api.post(`/pedidos/crear-preferencia-delivery`, { 
          items: carrito,
          deliveryInfo,
          total
        });
        
        if (response.data.initPoint) {
          const pagoData = { 
            metodoPago: 'mercadopago', 
            carrito, 
            deliveryInfo, 
            total 
          };
          if (response.data.preferenceId) {
            pagoData.preferenceId = response.data.preferenceId;
          }
          localStorage.setItem('pagoPendienteDelivery', JSON.stringify(pagoData));
          window.location.href = response.data.initPoint;
          return;
        }
      } catch (err) {
        console.error('Error al iniciar pago:', err);
        setError(err.response?.data?.error || 'Error al conectar con MercadoPago');
        setLoading(false);
      }
    };

    iniciarPago();
  }, []);

  if (error) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Error</h2>
        <p style={{ color: 'var(--error)' }}>{error}</p>
        <button onClick={() => navigate('/menu-delivery')} className="btn btn-primary" style={{ marginTop: '20px' }}>
          Volver al menú
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
      <h2>Conectando con MercadoPago...</h2>
      <p style={{ color: 'var(--text-secondary)' }}>
        Por favor esperá mientras te redirigimos al pago
      </p>
    </div>
  );
}

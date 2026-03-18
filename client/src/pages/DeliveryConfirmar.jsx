import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function DeliveryConfirmar() {
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [pagoData, setPagoData] = useState(null);

  useEffect(() => {
    const datos = localStorage.getItem('pagoConfirmadoDelivery');
    if (datos) {
      setPagoData(JSON.parse(datos));
    } else {
      navigate('/seleccionar-modo');
    }
    setLoading(false);
  }, []);

  const confirmarPedido = async () => {
    if (!pagoData) return;
    
    setLoading(true);
    try {
      const res = await api.post('/pedidos/delivery', {
        items: pagoData.carrito,
        deliveryInfo: pagoData.deliveryInfo,
        tipoPago: pagoData.metodoPago,
        total: pagoData.total
      });

      localStorage.removeItem('pagoConfirmadoDelivery');
      localStorage.removeItem('carritoDelivery');
      localStorage.removeItem('deliveryInfo');
      localStorage.removeItem('modoPedido');

      addToast('¡Pedido confirmado! Lo estamos preparando', 'success');
      navigate('/delivery-exitoso');
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al confirmar pedido', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container">Cargando...</div>;
  }

  if (!pagoData) return null;

  return (
    <div className="container" style={{ minHeight: '100vh', textAlign: 'center' }}>
      <img src="/img/pisocero.png" alt="Piso0" style={{ width: '100px', margin: '20px 0' }} />
      
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
      <h2 style={{ marginBottom: '16px' }}>Confirmar Pedido</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Revisá los datos de tu pedido antes de confirmar
      </p>

      <div className="card" style={{ textAlign: 'left', marginBottom: '24px' }}>
        <h4 style={{ marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
          📍 Datos de entrega
        </h4>
        <p><strong>Nombre:</strong> {pagoData.deliveryInfo.nombre}</p>
        <p><strong>Teléfono:</strong> {pagoData.deliveryInfo.telefono}</p>
        <p><strong>Dirección:</strong> {pagoData.deliveryInfo.direccion}</p>
      </div>

      <div className="card" style={{ textAlign: 'left', marginBottom: '24px' }}>
        <h4 style={{ marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
          🛒 Tu pedido
        </h4>
        {pagoData.carrito.map(item => (
          <div key={item.productoId} className="flex flex-between" style={{ padding: '8px 0' }}>
            <span>{item.cantidad}x {item.productoNombre}</span>
            <span>${item.precioUnitario * item.cantidad}</span>
          </div>
        ))}
        <div className="flex flex-between" style={{ borderTop: '2px solid var(--gold)', paddingTop: '12px', marginTop: '12px' }}>
          <strong>Total:</strong>
          <strong style={{ color: 'var(--gold)', fontSize: '18px' }}>${pagoData.total}</strong>
        </div>
      </div>

      <div className="card" style={{ textAlign: 'left', marginBottom: '24px', background: 'var(--secondary)' }}>
        <h4 style={{ marginBottom: '8px' }}>💳 Pago</h4>
        <p style={{ color: 'var(--success)' }}>
          {pagoData.metodoPago === 'mercadopago' ? '✓ MercadoPago' : '✓ Efectivo (pagas cuando llega)'}
        </p>
      </div>

      <button 
        onClick={confirmarPedido}
        className="btn btn-primary"
        style={{ width: '100%', padding: '16px', fontSize: '16px' }}
        disabled={loading}
      >
        {loading ? 'Confirmando...' : '✓ Confirmar Pedido'}
      </button>

      <button 
        onClick={() => {
          localStorage.removeItem('pagoConfirmadoDelivery');
          navigate('/menu-delivery');
        }}
        className="btn btn-secondary"
        style={{ width: '100%', marginTop: '12px' }}
      >
        Volver al menú
      </button>
    </div>
  );
}

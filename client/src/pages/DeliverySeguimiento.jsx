import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { socket } from '../services/socket';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

export default function DeliverySeguimiento() {
  const { addToast } = useToast();
  const { logout } = useAuth();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const deliveryInfo = JSON.parse(localStorage.getItem('deliveryInfo') || '{}');

  useEffect(() => {
    const pedidoId = localStorage.getItem('deliveryPedidoId');
    
    if (!pedidoId) {
      navigate('/menu-delivery');
      return;
    }

    const fetchPedido = async () => {
      try {
        const res = await api.get(`/pedidos/${pedidoId}`);
        setPedido(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar el pedido');
        setLoading(false);
      }
    };

    fetchPedido();

    socket.emit('join-admin');
    
    const handlePedidoActualizado = (data) => {
      if (data.id === pedidoId) {
        setPedido(data);
        
        if (data.estado === 'preparando' && pedido?.estado === 'pendiente') {
          addToast('¡Tu pedido está siendo preparado!', 'info');
        } else if (data.estado === 'listo') {
          addToast('¡Tu pedido está listo para enviar!', 'success');
        } else if (data.estado === 'enviando') {
          addToast('🚗 ¡Tu pedido está en camino!', 'success');
        } else if (data.estado === 'entregado') {
          addToast('✓ ¡Tu pedido ha sido entregado!', 'success');
        }
      }
    };

    socket.on('pedido-actualizado', handlePedidoActualizado);

    return () => {
      socket.off('pedido-actualizado', handlePedidoActualizado);
    };
  }, []);

  const estadoOrden = ['pendiente', 'preparando', 'listo', 'enviando', 'entregado'];
  const estadoLabels = {
    pendiente: 'Pendiente',
    preparando: 'Preparando',
    listo: 'Listo',
    enviando: 'En camino',
    entregado: 'Entregado'
  };

  const estadoIcons = {
    pendiente: '⏳',
    preparando: '👨‍🍳',
    listo: '✅',
    enviando: '🚗',
    entregado: '🏠'
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '60px' }}>
        <h2>Cargando...</h2>
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '60px' }}>
        <h2>Error</h2>
        <p>{error || 'No se encontró el pedido'}</p>
        <button onClick={() => navigate('/menu-delivery')} className="btn btn-primary">
          Volver al Menú
        </button>
      </div>
    );
  }

  const estadoActual = estadoOrden.indexOf(pedido.estado);
  const isDelivery = pedido.tipoPedido === 'delivery' || pedido.mesaId === 'DELIVERY';

  return (
    <div className="container" style={{ paddingTop: '20px' }}>
      <div className="flex items-center gap-20" style={{ marginBottom: '24px' }}>
        <img src="/img/pisocero.png" alt="Piso0" style={{ height: '50px', width: 'auto' }} />
        <h2 style={{ margin: 0 }}>Seguimiento de Delivery</h2>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '60px', marginBottom: '10px' }}>
            {estadoIcons[pedido.estado] || '📦'}
          </div>
          <h3 style={{ color: 'var(--gold)', margin: 0 }}>
            {estadoLabels[pedido.estado] || pedido.estado}
          </h3>
          {pedido.estado === 'enviando' && (
            <p style={{ color: 'var(--success)', marginTop: '8px' }}>
              ¡Ya viene en camino hacia tu dirección!
            </p>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          {isDelivery && deliveryInfo && (
            <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--secondary)', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '8px' }}>📍 Dirección de entrega:</h4>
              <p style={{ margin: 0 }}><strong>{deliveryInfo.nombre}</strong></p>
              <p style={{ margin: 0 }}>📱 {deliveryInfo.telefono}</p>
              <p style={{ margin: 0 }}>🏠 {deliveryInfo.direccion}</p>
            </div>
          )}

          {estadoOrden.map((estado, index) => (
            <div 
              key={estado} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '12px',
                opacity: index <= estadoActual ? 1 : 0.4
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: index <= estadoActual ? 'var(--gold)' : 'var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px',
                fontSize: '18px'
              }}>
                {index < estadoActual ? '✓' : estadoIcons[estado]}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ 
                  fontWeight: index <= estadoActual ? '600' : '400',
                  fontSize: '14px'
                }}>
                  {estadoLabels[estado]}
                </span>
                {index === estadoActual && (
                  <span style={{ 
                    display: 'block', 
                    fontSize: '12px', 
                    color: 'var(--gold)' 
                  }}>
                    Estado actual
                  </span>
                )}
              </div>
              {index < estadoOrden.length - 1 && (
                <div style={{
                  width: '2px',
                  height: '20px',
                  background: index < estadoActual ? 'var(--gold)' : 'var(--border)',
                  marginLeft: '6px'
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h4 style={{ marginBottom: '12px' }}>📋 Detalle del Pedido</h4>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Pedido #{pedido.id?.slice(0, 8)}
        </p>
        
        {pedido.items?.map((item, index) => (
          <div 
            key={index} 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: index < pedido.items.length - 1 ? '1px solid var(--border)' : 'none'
            }}
          >
            <span>{item.cantidad}x {item.productoNombre}</span>
            <span>${parseFloat(item.precioUnitario) * item.cantidad}</span>
          </div>
        ))}
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '2px solid var(--accent)',
          fontWeight: '600',
          fontSize: '16px'
        }}>
          <span>Total:</span>
          <span style={{ color: 'var(--accent)' }}>${pedido.total}</span>
        </div>

        {pedido.tipoPago && (
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <span className="badge badge-listo">
              {pedido.tipoPago === 'mercadopago' ? 'Pagado con MercadoPago' : 'Pagará en caja'}
            </span>
          </div>
        )}
      </div>

      <button 
        onClick={() => {
          localStorage.removeItem('deliveryPedidoId');
          localStorage.removeItem('deliveryInfo');
          localStorage.removeItem('carritoDelivery');
          localStorage.removeItem('modoPedido');
          logout();
          navigate('/login');
        }} 
        className="btn btn-secondary" 
        style={{ width: '100%', marginTop: '16px' }}
      >
        Cerrar Sesión
      </button>
    </div>
  );
}

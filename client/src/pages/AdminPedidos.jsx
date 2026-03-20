import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { socket, joinAdmin } from '../services/socket';
import NotificacionesMozo from '../components/NotificacionesMozo';
import TicketPrint from '../components/TicketPrint';
import KitchenTicket from '../components/KitchenTicket';
import { useToast } from '../components/Toast';

export default function AdminPedidos() {
  const { addToast } = useToast();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [pedidoParaTicket, setPedidoParaTicket] = useState(null);
  const [kitchenTicketPedido, setKitchenTicketPedido] = useState(null);
  const [showCobrarModal, setShowCobrarModal] = useState(false);
  const [pedidoACobrar, setPedidoACobrar] = useState(null);
  const [tipoPagoCobrar, setTipoPagoCobrar] = useState('efectivo');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [pedidoACancelar, setPedidoACancelar] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showStartModal, setShowStartModal] = useState(false);
  const [pedidoAIniciar, setPedidoAIniciar] = useState(null);

  useEffect(() => {
    fetchPedidos();
    joinAdmin();

    socket.on('nuevo-pedido', (pedido) => {
      const esDelivery = pedido.tipoPedido === 'delivery' || pedido.mesaId === 'DELIVERY';
      setPedidos(prev => [{ ...pedido, esDelivery }, ...prev]);
    });

    socket.on('pedido-actualizado', (pedido) => {
      const esDelivery = pedido.tipoPedido === 'delivery' || pedido.mesaId === 'DELIVERY';
      setPedidos(prev => prev.map(p => p.id === pedido.id ? { ...pedido, esDelivery } : p));
    });

    socket.on('cierre-dia', () => {
      fetchPedidos();
    });

    socket.on('mozo-solicitado', (data) => {
      addToast(`¡Mozo solicitado! Mesa ${data.numeroMesa}`, 'warning');
    });

    return () => {
      socket.off('nuevo-pedido');
      socket.off('pedido-actualizado');
      socket.off('cierre-dia');
      socket.off('mozo-solicitado');
    };
  }, []);

  const fetchPedidos = async () => {
    try {
      const [pedidosRes, mesasRes] = await Promise.all([
        api.get('/pedidos'),
        api.get('/mesas')
      ]);
      
      const mesaMap = {};
      mesasRes.data.forEach(m => { mesaMap[m.id] = m.numero; });
      
      const hoy = new Date().toISOString().split('T')[0];
      const pedidosHoy = pedidosRes.data.filter(p => {
        const fechaPedido = new Date(p.createdAt).toISOString().split('T')[0];
        return fechaPedido === hoy;
      }).map(p => {
        const esDelivery = p.tipoPedido === 'delivery' || p.mesaId === 'DELIVERY';
        return {
          ...p,
          numeroMesa: esDelivery ? '🚗 Delivery' : (mesaMap[p.mesaId] || p.mesaId),
          esDelivery
        };
      });
      
      setPedidos(pedidosHoy);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (pedidoId, nuevoEstado) => {
    try {
      await api.put(`/pedidos/${pedidoId}/estado`, { estado: nuevoEstado });
      setPedidos(prev => prev.map(p => 
        p.id === pedidoId ? { ...p, estado: nuevoEstado } : p
      ));
      addToast(`Pedido marcado como ${nuevoEstado}`, 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al cambiar estado', 'error');
    }
  };

  const iniciarPreparacion = (pedido) => {
    setPedidoAIniciar(pedido);
    setShowStartModal(true);
  };

  const confirmarInicioPreparacion = (imprimirTicket) => {
    if (!pedidoAIniciar) return;
    
    cambiarEstado(pedidoAIniciar.id, 'preparando');
    
    if (imprimirTicket) {
      setKitchenTicketPedido(pedidoAIniciar);
    }
    
    setShowStartModal(false);
    setPedidoAIniciar(null);
  };

  const marcarCobrado = (pedido) => {
    setPedidoACobrar(pedido);
    setShowCobrarModal(true);
  };

  const confirmarCobro = async () => {
    if (!pedidoACobrar) return;
    try {
      await api.post(`/pedidos/${pedidoACobrar.id}/pago`, { tipoPago: tipoPagoCobrar });
      await api.put(`/pedidos/${pedidoACobrar.id}/estado`, { estado: 'pagado' });
      setPedidos(prev => prev.map(p => 
        p.id === pedidoACobrar.id ? { ...p, estado: 'pagado', tipoPago: tipoPagoCobrar } : p
      ));
      addToast('Pedido cobrado correctamente', 'success');
      setShowCobrarModal(false);
      setPedidoACobrar(null);
      setTipoPagoCobrar('efectivo');
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al cobrar', 'error');
    }
  };

  const abrirCancelar = (pedido) => {
    setPedidoACancelar(pedido);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const confirmarCancelacion = async () => {
    if (!pedidoACancelar) return;
    try {
      await api.put(`/pedidos/${pedidoACancelar.id}/estado`, { estado: 'cancelado', motivoCancelacion: cancelReason });
      setPedidos(prev => prev.map(p => 
        p.id === pedidoACancelar.id ? { ...p, estado: 'cancelado', motivoCancelacion: cancelReason } : p
      ));
      addToast('Pedido cancelado', 'warning');
      setShowCancelModal(false);
      setPedidoACancelar(null);
      setCancelReason('');
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al cancelar', 'error');
    }
  };

  const pedidosFiltrados = filtroEstado === 'todos' 
    ? pedidos 
    : pedidos.filter(p => p.estado === filtroEstado);

  const estados = ['pendiente', 'preparando', 'listo', 'enviando', 'entregado', 'pagado', 'cancelado'];

  if (loading) {
    return <div className="container">Cargando...</div>;
  }

  return (
    <div className="container">
      <div className="flex flex-between" style={{ marginBottom: '32px' }}>
        <div className="flex items-center gap-20">
          <img src="/img/pisocero.png" alt="Piso0" style={{ height: '60px', width: 'auto' }} />
          <h1 style={{ margin: 0 }}>Comanda - Pedidos</h1>
        </div>
        <Link to="/admin" className="btn btn-secondary">← Volver</Link>
      </div>

      <NotificacionesMozo />

      <div className="flex gap-10" style={{ marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setFiltroEstado('todos')}
          className={`btn ${filtroEstado === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Todos ({pedidos.length})
        </button>
        {estados.map(estado => (
          <button
            key={estado}
            onClick={() => setFiltroEstado(estado)}
            className={`btn ${filtroEstado === estado ? 'btn-primary' : 'btn-secondary'}`}
          >
            {estado.charAt(0).toUpperCase() + estado.slice(1)} ({pedidos.filter(p => p.estado === estado).length})
          </button>
        ))}
      </div>

      <div className="grid grid-3">
        {pedidosFiltrados.map(pedido => (
          <div key={pedido.id} className="card" style={{ opacity: pedido.estado === 'cancelado' ? 0.6 : 1 }}>
            <div className="flex flex-between" style={{ marginBottom: '12px', alignItems: 'flex-start' }}>
              <div>
                <h3>Pedido #{pedido.id.slice(0, 8)}</h3>
                <span style={{ fontSize: '13px', color: 'var(--gold)' }}>{pedido.esDelivery ? '🚗 Delivery' : `🍽️ Mesa ${pedido.numeroMesa}`}</span>
                {pedido.esDelivery && pedido.deliveryInfo && (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    📍 {pedido.deliveryInfo.direccion}
                  </p>
                )}
              </div>
              <span className={`badge badge-${pedido.estado}`} style={{ textTransform: 'capitalize' }}>{pedido.estado}</span>
            </div>

            {pedido.estado === 'cancelado' && pedido.motivoCancelacion && (
              <div style={{ background: 'var(--error)', padding: '8px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px' }}>
                ❌ Cancelado: {pedido.motivoCancelacion}
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              {pedido.items.map((item, index) => (
                <div key={index} style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                  {item.cantidad}x {item.productoNombre}
                </div>
              ))}
            </div>

            <div className="flex flex-between" style={{ marginBottom: '16px', paddingTop: '12px', borderTop: '2px solid var(--accent)' }}>
              <span style={{ fontWeight: '600' }}>Total:</span>
              <span style={{ fontWeight: '600', color: 'var(--accent)' }}>${pedido.total}</span>
            </div>

              {pedido.estado !== 'cancelado' && pedido.estado !== 'entregado' && pedido.estado !== 'pagado' && (
              <div className="grid grid-2" style={{ gap: '8px' }}>
                {pedido.estado === 'pendiente' && (
                  <button onClick={() => iniciarPreparacion(pedido)} className="btn btn-primary" style={{ padding: '8px' }}>
                    Start
                  </button>
                )}
                {pedido.estado === 'preparando' && (
                  <button onClick={() => cambiarEstado(pedido.id, 'listo')} className="btn btn-success" style={{ padding: '8px' }}>
                    Listo
                  </button>
                )}
                {pedido.estado === 'listo' && pedido.esDelivery && (
                  <button onClick={() => cambiarEstado(pedido.id, 'enviando')} className="btn btn-warning" style={{ padding: '8px', color: '#000' }}>
                    🚗 Enviar
                  </button>
                )}
                {pedido.estado === 'listo' && !pedido.esDelivery && (
                  <button onClick={() => cambiarEstado(pedido.id, 'entregado')} className="btn btn-primary" style={{ padding: '8px' }}>
                    Entregar
                  </button>
                )}
                {pedido.estado === 'enviando' && (
                  <button onClick={() => cambiarEstado(pedido.id, 'entregado')} className="btn btn-primary" style={{ padding: '8px' }}>
                    ✓ Confirmar Entrega
                  </button>
                )}
                {pedido.estado === 'entregado' && !pedido.tipoPago && (
                  <button onClick={() => marcarCobrado(pedido)} className="btn btn-primary" style={{ padding: '8px' }}>
                    💰 Cobrar
                  </button>
                )}
                {pedido.estado === 'pendiente' && (
                  <button onClick={() => abrirCancelar(pedido)} className="btn btn-danger" style={{ padding: '8px' }}>
                    Cancelar
                  </button>
                )}
              </div>
            )}

            {pedido.estado === 'enviando' && (
              <p style={{ marginTop: '12px', color: 'var(--warning)', fontSize: '14px', fontWeight: '600' }}>
                🚗 En camino a {pedido.deliveryInfo?.direccion}
              </p>
            )}

            {pedido.estado === 'entregado' && (
              <p style={{ marginTop: '12px', color: 'var(--success)', fontSize: '14px' }}>
                ✓ Pedido entregado
              </p>
            )}

            {pedido.estado === 'pagado' && (
              <>
                <p style={{ marginTop: '12px', color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
                  ✓ Pedido pagado
                </p>
                <button 
                  onClick={() => setPedidoParaTicket(pedido)}
                  className="btn btn-primary" 
                  style={{ marginTop: '12px', width: '100%', padding: '8px' }}
                >
                  🖨️ Imprimir Ticket
                </button>
              </>
            )}

            {pedido.tipoPago && pedido.estado !== 'cancelado' && (
              <p style={{ marginTop: '12px', color: 'var(--success)', fontSize: '14px' }}>
                ✓ Pagado con {pedido.tipoPago}
              </p>
            )}
          </div>
        ))}
      </div>

      {pedidosFiltrados.length === 0 && (
        <div className="card text-center">
          <p style={{ color: 'var(--text-secondary)' }}>No hay pedidos</p>
        </div>
      )}

      {pedidoParaTicket && (
        <TicketPrint pedido={pedidoParaTicket} onClose={() => setPedidoParaTicket(null)} />
      )}

      {showCobrarModal && pedidoACobrar && (
        <div className="modal-overlay" onClick={() => setShowCobrarModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💰 Cobrar Pedido</h2>
              <button onClick={() => setShowCobrarModal(false)} className="modal-close">×</button>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
              <p><strong>Pedido:</strong> #{pedidoACobrar.id.slice(0, 8)}</p>
              <p><strong>Total:</strong> <span style={{ color: 'var(--gold)', fontWeight: '600' }}>${pedidoACobrar.total}</span></p>
            </div>

            <div className="form-group">
              <label>Método de Pago</label>
              <select value={tipoPagoCobrar} onChange={(e) => setTipoPagoCobrar(e.target.value)}>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="mercadopago">MercadoPago</option>
              </select>
            </div>

            <button onClick={confirmarCobro} className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
              Confirmar Cobro
            </button>
          </div>
        </div>
      )}

      {showCancelModal && pedidoACancelar && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>❌ Cancelar Pedido</h2>
              <button onClick={() => setShowCancelModal(false)} className="modal-close">×</button>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
              <p><strong>Pedido:</strong> #{pedidoACancelar.id.slice(0, 8)}</p>
              <p><strong>Total:</strong> ${pedidoACancelar.total}</p>
            </div>

            <div className="form-group">
              <label>Motivo de cancelación</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ingresá el motivo de la cancelación..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--secondary)',
                  color: 'var(--text)',
                  minHeight: '100px',
                  resize: 'vertical'
                }}
                required
              />
            </div>

            <button onClick={confirmarCancelacion} className="btn btn-danger" style={{ width: '100%', marginTop: '16px' }} disabled={!cancelReason.trim()}>
              Confirmar Cancelación
            </button>
          </div>
        </div>
      )}

      {showStartModal && pedidoAIniciar && (
        <div className="modal-overlay" onClick={() => setShowStartModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🍳 Iniciar Preparación</h2>
              <button onClick={() => setShowStartModal(false)} className="modal-close">×</button>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
              <p><strong>Pedido:</strong> #{pedidoAIniciar.id.slice(0, 8)}</p>
              <p><strong>Mesa:</strong> {pedidoAIniciar.numeroMesa}</p>
            </div>

            <p style={{ marginBottom: '16px' }}>¿Querés imprimir el ticket para la cocina?</p>

            <button 
              onClick={() => confirmarInicioPreparacion(true)} 
              className="btn btn-primary" 
              style={{ width: '100%', marginBottom: '10px' }}
            >
              🖨️ Sí, Imprimir Ticket
            </button>
            <button 
              onClick={() => confirmarInicioPreparacion(false)} 
              className="btn btn-secondary" 
              style={{ width: '100%' }}
            >
              No, solo comenzar
            </button>
          </div>
        </div>
      )}

      {kitchenTicketPedido && (
        <KitchenTicket 
          pedido={kitchenTicketPedido} 
          onClose={() => setKitchenTicketPedido(null)} 
        />
      )}
    </div>
  );
}

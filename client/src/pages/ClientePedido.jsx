import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { socket, joinMesa } from '../services/socket';
import { useToast } from '../components/Toast';

export default function ClientePedido() {
  const { addToast } = useToast();
  const [mostrarRecibo, setMostrarRecibo] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const notifiedRef = useRef({});

  useEffect(() => {
    const cargarPedidos = async () => {
      const codigoQR = localStorage.getItem('mesaCodigoQR');
      if (!codigoQR) {
        navigate('/scan');
        return;
      }
      
      try {
        const mesaRes = await api.get(`/mesas/qr/${codigoQR}`);
        const pedidosRes = await api.get(`/pedidos/mesa/${codigoQR}`);
        
        const pedidosActivos = pedidosRes.data.filter(p => 
          p.estado !== 'cancelado' && !(p.estado === 'entregado' && p.tipoPago)
        );
        
        setPedidos(pedidosActivos);
        
        const pedidoActual = localStorage.getItem('pedidoActual');
        if (pedidoActual) {
          const pedidoData = JSON.parse(pedidoActual);
          const existe = pedidosActivos.find(p => p.id === pedidoData.id);
          if (existe) {
            setPedidoSeleccionado(existe);
          } else if (pedidosActivos.length > 0) {
            setPedidoSeleccionado(pedidosActivos[0]);
          }
        } else if (pedidosActivos.length > 0) {
          setPedidoSeleccionado(pedidosActivos[0]);
        }
        
        joinMesa(mesaRes.data.id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    cargarPedidos();
  }, [navigate]);

  useEffect(() => {
    const handlePedidoActualizado = (data) => {
      setPedidos(prev => {
        const actualizados = prev.map(p => p.id === data.id ? data : p);
        
        if (pedidoSeleccionado?.id === data.id) {
          setPedidoSeleccionado(data);
          localStorage.setItem('pedidoActual', JSON.stringify(data));
          
          if (data.estado === 'preparando' && !notifiedRef.current[data.id]) {
            notifiedRef.current[data.id] = true;
            addToast('¡Tu pedido está siendo preparado!', 'info');
          } else if (data.estado === 'listo') {
            addToast('¡Tu pedido está listo!', 'success');
          } else if (data.tipoPago && !pedidoSeleccionado.tipoPago) {
            addToast('¡Tu pago ha sido registrado! Gracias.', 'success');
          }
        }
        
        return actualizados;
      });
    };

    socket.on('pedido-actualizado', handlePedidoActualizado);

    return () => {
      socket.off('pedido-actualizado', handlePedidoActualizado);
    };
  }, [pedidoSeleccionado?.id]);

  const solicitarMozo = () => {
    if (!pedidoSeleccionado) return;
    const numeroMesa = localStorage.getItem('mesaNumero') || 'Mesa';
    socket.emit('solicitar-mozo', { 
      mesaId: pedidoSeleccionado.mesaId,
      numeroMesa: numeroMesa
    });
    addToast('Mozo solicitado', 'warning');
  };

  const pedirLaCuenta = () => {
    if (!pedidoSeleccionado) return;
    const numeroMesa = localStorage.getItem('mesaNumero') || 'Mesa';
    socket.emit('pedir-cuenta', { 
      mesaId: pedidoSeleSeleccionado.mesaId,
      numeroMesa: numeroMesa
    });
    addToast('La cuenta ha sido solicitada', 'info');
  };

  const volverAlMenu = () => {
    navigate(`/mesa/${localStorage.getItem('mesaCodigoQR') || ''}`);
  };

  if (loading) {
    return <div className="container">Cargando...</div>;
  }

  if (pedidos.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '40px' }}>
        <h2>No tienes pedidos</h2>
        <button onClick={() => navigate(`/mesa/${localStorage.getItem('mesaCodigoQR') || ''}`)} className="btn btn-primary" style={{ marginTop: '20px' }}>
          Hacer un Pedido
        </button>
      </div>
    );
  }

  const pedido = pedidoSeleccionado || pedidos[0];
  const estadoOrden = ['pendiente', 'preparando', 'listo', 'entregado'];
  const estadoActual = estadoOrden.indexOf(pedido.estado);

  return (
    <div className="container" style={{ minHeight: '100vh' }}>
      <h2 style={{ marginBottom: '24px' }}>Mis Pedidos</h2>

      {pedidos.length > 1 && (
        <div className="flex gap-10" style={{ marginBottom: '20px', flexWrap: 'wrap' }}>
          {pedidos.map(p => (
            <button
              key={p.id}
              onClick={() => {
                setPedidoSeleccionado(p);
                localStorage.setItem('pedidoActual', JSON.stringify(p));
              }}
              className={`btn ${pedido.id === p.id ? 'btn-primary' : 'btn-secondary'}`}
            >
              #{p.id.slice(0, 8)} - {p.estado}
            </button>
          ))}
        </div>
      )}

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="flex flex-between" style={{ marginBottom: '20px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Estado:</span>
          <span className={`badge badge-${pedido.estado}`} style={{ textTransform: 'capitalize' }}>
            {pedido.estado}
          </span>
        </div>

        <div style={{ marginBottom: '24px' }}>
          {estadoOrden.map((estado, index) => (
            <div key={estado} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: index <= estadoActual ? 'var(--gold)' : 'var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px',
                color: index <= estadoActual ? '#000' : 'var(--text-secondary)',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                {index < estadoActual ? '✓' : index + 1}
              </div>
              <span style={{ textTransform: 'capitalize', color: index <= estadoActual ? 'var(--text)' : 'var(--text-secondary)', fontWeight: index <= estadoActual ? '600' : '400' }}>
                {estado}
              </span>
            </div>
          ))}
        </div>

        {pedido.estado === 'cancelado' && (
          <div style={{ padding: '16px', background: 'var(--error)', borderRadius: '8px', color: 'white' }}>
            <h4 style={{ marginBottom: '8px' }}>❌ Pedido Cancelado</h4>
            <p><strong>Motivo:</strong> {pedido.motivoCancelacion || 'Sin especificar'}</p>
          </div>
        )}

        <h4 style={{ marginBottom: '16px' }}>Items:</h4>
        {pedido.items.map((item, index) => (
          <div key={index} className="flex flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span>{item.cantidad}x {item.productoNombre}</span>
            <span>${item.precioUnitario * item.cantidad}</span>
          </div>
        ))}

        <div className="flex flex-between" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid var(--accent)' }}>
          <span style={{ fontSize: '18px', fontWeight: '600' }}>Total:</span>
          <span style={{ fontSize: '18px', fontWeight: '600', color: 'var(--accent)' }}>${pedido.total}</span>
        </div>

        {!pedido.tipoPago && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--warning)', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ color: '#000', fontWeight: '600' }}>⏳ Pago Pendiente</p>
          </div>
        )}
      </div>

      {pedido.estado !== 'cancelado' && (
        <>
          <button 
            onClick={solicitarMozo} 
            className="btn btn-secondary" 
            style={{ width: '100%', marginBottom: '12px' }}
          >
            📞 Solicitar Mozo
          </button>

          <button 
            onClick={pedirLaCuenta} 
            className="btn btn-warning" 
            style={{ width: '100%', marginBottom: '12px', color: '#000' }}
          >
            🧾 Pedir la Cuenta
          </button>

          {!pedido.tipoPago && (
            <button 
              onClick={() => navigate('/pago')} 
              className="btn btn-primary" 
              style={{ width: '100%' }}
            >
              💳 Pagar
            </button>
          )}
        </>
      )}

      {pedido.tipoPago && (
        <div className="card" style={{ textAlign: 'center', marginTop: '16px' }}>
          <p style={{ color: 'var(--success)', fontWeight: '600' }}>
            {pedido.tipoPago === 'mercadopago' ? '✓ Pagado con MercadoPago' : '✓ Pagará en caja'}
          </p>
        </div>
      )}

      {pedido.tipoPago && (
        <button 
          onClick={() => setMostrarRecibo(true)}
          className="btn btn-secondary" 
          style={{ width: '100%', marginTop: '12px' }}
        >
          🧾 Ver Recibo
        </button>
      )}

      {mostrarRecibo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setMostrarRecibo(false)}>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '90%',
            maxHeight: '80vh', overflow: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>🧾 Piso0</h2>
              <p style={{ color: '#666', margin: '4px 0' }}>Comprobante de Pago</p>
            </div>
            <div style={{ borderTop: '2px dashed #333', borderBottom: '2px dashed #333', padding: '16px 0', margin: '16px 0' }}>
              <p><strong>Pedido #:</strong> {pedido.id?.slice(0, 8)}</p>
              <p><strong>Mesa:</strong> {pedido.numeroMesa || localStorage.getItem('mesaNumero')}</p>
              <p><strong>Fecha:</strong> {new Date(pedido.createdAt).toLocaleString('es-AR')}</p>
            </div>
            <div>
              {pedido.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>{item.cantidad}x {item.productoNombre}</span>
                  <span>${(item.precioUnitario * item.cantidad).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '2px solid #333', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
              <strong>TOTAL</strong>
              <strong>${parseFloat(pedido.total).toFixed(2)}</strong>
            </div>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <p><strong>Método:</strong> {pedido.tipoPago === 'mercadopago' ? 'MercadoPago' : 'Pago en Caja'}</p>
              <p style={{ color: 'green', fontWeight: 'bold' }}>✓ PAGADO</p>
            </div>
            <p style={{ textAlign: 'center', marginTop: '16px', color: '#666', fontSize: '14px' }}>Gracias por su visita!</p>
            <button onClick={() => setMostrarRecibo(false)} className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      <button 
        onClick={() => {
          const codigoQR = localStorage.getItem('mesaCodigoQR');
          if (codigoQR) {
            navigate(`/mesa/${codigoQR}`);
          } else {
            navigate('/scan');
          }
        }} 
        className="btn btn-secondary" 
        style={{ width: '100%', marginTop: '12px' }}
      >
        ← Volver al Menú
      </button>
    </div>
  );
}

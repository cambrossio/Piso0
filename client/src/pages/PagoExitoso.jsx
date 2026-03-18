import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function PagoExitoso() {
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pedidoId = searchParams.get('pedidoId');
    if (pedidoId) {
      api.get(`/pedidos/${pedidoId}`).then(res => {
        const pedidoData = res.data;
        setPedido(pedidoData);
        const updated = { ...pedidoData, tipoPago: 'mercadopago', estado: 'pagado' };
        localStorage.setItem('pedidoActual', JSON.stringify(updated));
        api.put(`/pedidos/${pedidoId}/estado`, { estado: 'pagado' }).catch(() => {});
        api.post(`/pedidos/${pedidoId}/pago`, { tipoPago: 'mercadopago' }).catch(() => {});
        addToast('¡Pago procesado correctamente!', 'success');
        setLoading(false);
      }).catch(() => {
        const stored = localStorage.getItem('pedidoActual');
        if (stored) {
          setPedido(JSON.parse(stored));
        }
        setLoading(false);
      });
    } else {
      const stored = localStorage.getItem('pedidoActual');
      if (stored) {
        const pedidoData = JSON.parse(stored);
        setPedido(pedidoData);
      }
      setLoading(false);
    }
  }, [searchParams]);

  const confirmarPago = async () => {
    if (!pedido) return;
    try {
      await api.put(`/pedidos/${pedido.id}/estado`, { estado: 'pagado' });
      const updated = { ...pedido, estado: 'pagado', tipoPago: 'mercadopago' };
      localStorage.setItem('pedidoActual', JSON.stringify(updated));
      setPedido(updated);
      addToast('Pago confirmado', 'success');
    } catch (err) {
      addToast('Error al confirmar pago', 'error');
    }
  };

  if (loading) return <div className="container">Cargando...</div>;
  if (!pedido) return (
    <div className="container" style={{ textAlign: 'center', padding: '40px' }}>
      <p>No se encontró el pedido</p>
      <button onClick={() => navigate('/scan')} className="btn btn-primary">Escanear QR</button>
    </div>
  );

  return (
    <div className="container" style={{ minHeight: '100vh', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
        <h2 style={{ color: 'var(--success)', marginBottom: '8px' }}>¡Pago Exitoso!</h2>
        <p>Tu pedido ha sido pagado correctamente</p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
          Comprobante de Pago
        </h3>
        <p><strong>Pedido #:</strong> {pedido.id?.slice(0, 8) || pedido.id}</p>
        <p><strong>Mesa:</strong> {pedido.numeroMesa || pedido.mesaId}</p>
        <p><strong>Fecha:</strong> {new Date().toLocaleDateString('es-AR', { 
          day: '2-digit', month: '2-digit', year: 'numeric', 
          hour: '2-digit', minute: '2-digit' 
        })}</p>
        <p><strong>Método de Pago:</strong> MercadoPago</p>
        <p><strong>Estado:</strong> <span style={{ color: 'var(--success)' }}>PAGADO</span></p>
        
        <div style={{ marginTop: '16px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
          <h4 style={{ marginBottom: '12px' }}>Items:</h4>
          {pedido.items?.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>{item.cantidad}x {item.productoNombre}</span>
              <span>${(item.precioUnitario * item.cantidad).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: '2px solid #333', paddingTop: '8px', marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <strong>TOTAL</strong>
            <strong>${parseFloat(pedido.total).toFixed(2)}</strong>
          </div>
        </div>
      </div>

      <button onClick={() => navigate('/pedido')} className="btn btn-primary" style={{ width: '100%', marginBottom: '12px' }}>
        Ver Mi Pedido
      </button>
    </div>
  );
}

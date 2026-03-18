import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { socket, joinAdmin } from '../services/socket';
import NotificacionesMozo from '../components/NotificacionesMozo';
import { useToast } from '../components/Toast';

export default function AdminMesas() {
  const { addToast } = useToast();
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showQR, setShowQR] = useState(null);
  const [form, setForm] = useState({
    numero: '',
    capacidad: '4'
  });

  useEffect(() => {
    fetchMesas();
    joinAdmin();

    socket.on('nuevo-pedido', () => {
      fetchMesas();
    });

    socket.on('pedido-actualizado', () => {
      fetchMesas();
    });

    return () => {
      socket.off('nuevo-pedido');
      socket.off('pedido-actualizado');
    };
  }, []);

  const fetchMesas = async () => {
    try {
      const res = await api.get('/mesas');
      setMesas(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/mesas', form);
      addToast('Mesa creada correctamente', 'success');
      setShowModal(false);
      setForm({ numero: '', capacidad: '4' });
      fetchMesas();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al crear mesa', 'error');
    }
  };

  const eliminarMesa = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta mesa?')) return;
    try {
      await api.delete(`/mesas/${id}`);
      addToast('Mesa eliminada', 'success');
      fetchMesas();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al eliminar', 'error');
    }
  };

  const verQR = async (mesa) => {
    try {
      const res = await api.get(`/mesas/${mesa.id}/qr`);
      setShowQR(res.data);
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al obtener QR', 'error');
    }
  };

  const cambiarEstadoMesa = async (mesa) => {
    const nuevoEstado = mesa.estado === 'libre' ? 'ocupada' : 'libre';
    try {
      await api.put(`/mesas/${mesa.id}`, { estado: nuevoEstado });
      addToast('Estado de mesa actualizado', 'success');
      fetchMesas();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al cambiar estado', 'error');
    }
  };

  const [pedidoVerMesa, setPedidoVerMesa] = useState(null);
  const [pedidosMesa, setPedidosMesa] = useState([]);

  const verPedidosMesa = async (mesa) => {
    try {
      const res = await api.get(`/pedidos/mesa/${mesa.codigoQR}`);
      setPedidosMesa(res.data.filter(p => p.estado !== 'cancelado'));
      setPedidoVerMesa(mesa);
    } catch (err) {
      addToast('Error al cargar pedidos', 'error');
    }
  };

  if (loading) {
    return <div className="container">Cargando...</div>;
  }

  return (
    <div className="container">
      <div className="flex flex-between" style={{ marginBottom: '32px' }}>
        <div className="flex items-center gap-20">
          <img src="/img/pisocero.png" alt="Piso0" style={{ height: '60px', width: 'auto' }} />
          <h1 style={{ margin: 0 }}>Gestión de Mesas</h1>
        </div>
        <div className="flex gap-10">
          <Link to="/admin" className="btn btn-secondary">← Volver</Link>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Nueva Mesa</button>
        </div>
      </div>

      <NotificacionesMozo />

      <div className="grid grid-4">
        {mesas.map(mesa => (
          <div key={mesa.id} className="card" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '48px', marginBottom: '8px' }}>{mesa.numero}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Capacidad: {mesa.capacidad} personas
            </p>
            <span className={`badge badge-${mesa.estado}`} style={{ marginBottom: '16px' }}>
              {mesa.estado}
            </span>
            
            <div className="flex gap-10" style={{ justifyContent: 'center', flexDirection: 'column' }}>
              <span>
              
              </span>
<button onClick={() => verQR(mesa)} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                 📱 Ver QR
               </button>
               {mesa.estado !== 'libre' && (
                 <button onClick={() => verPedidosMesa(mesa)} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                   📋 Ver Pedidos
                 </button>
               )}
               {mesa.estado !== 'libre' && (
                <button onClick={() => cambiarEstadoMesa(mesa)} className="btn btn-primary" style={{ padding: '8px 16px' }}>
                  🔓 Liberar Mesa
                </button>
              )}
              <button onClick={() => eliminarMesa(mesa.id)} className="btn btn-danger" style={{ padding: '8px 16px' }}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {mesas.length === 0 && (
        <div className="card text-center">
          <p style={{ color: 'var(--text-secondary)' }}>No hay mesas creadas</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nueva Mesa</h2>
              <button onClick={() => setShowModal(false)} className="modal-close">×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Número de Mesa</label>
                <input
                  type="number"
                  value={form.numero}
                  onChange={e => setForm({ ...form, numero: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Capacidad</label>
                <input
                  type="number"
                  value={form.capacidad}
                  onChange={e => setForm({ ...form, capacidad: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                Crear Mesa
              </button>
            </form>
          </div>
        </div>
      )}

      {showQR && (
        <div className="modal-overlay" onClick={() => setShowQR(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <div className="modal-header">
              <h2>Mesa {showQR.numero}</h2>
              <button onClick={() => setShowQR(null)} className="modal-close">×</button>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', display: 'inline-block', margin: '20px 0' }}>
              <QRCodeSVG value={`http://localhost:5173/mesa/${showQR.codigoQR}`} size={200} />
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Código: {showQR.codigoQR}
            </p>

            <p style={{ color: 'var(--text-secondary)' }}>
              Imprime este QR y pégalo en la mesa
            </p>
          </div>
        </div>
      )}

      {pedidoVerMesa && (
        <div className="modal-overlay" onClick={() => setPedidoVerMesa(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>📋 Pedidos Mesa {pedidoVerMesa.numero}</h2>
              <button onClick={() => setPedidoVerMesa(null)} className="modal-close">×</button>
            </div>

            {pedidosMesa.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                No hay pedidos activos en esta mesa
              </p>
            ) : (
              <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                {pedidosMesa.map(pedido => (
                  <div key={pedido.id} className="card" style={{ marginBottom: '12px', borderLeft: '4px solid var(--gold)' }}>
                    <div className="flex flex-between">
                      <span style={{ fontWeight: '600' }}>Pedido #{pedido.id.slice(0, 8)}</span>
                      <span className={`badge badge-${pedido.estado}`}>{pedido.estado}</span>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      {pedido.items?.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                          <span>{item.cantidad}x {item.productoNombre}</span>
                          <span>${item.precioUnitario * item.cantidad}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '8px', fontWeight: '600' }}>
                      Total: ${pedido.total}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

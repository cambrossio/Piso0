import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import NotificacionesMozo from '../components/NotificacionesMozo';
import TicketPrint from '../components/TicketPrint';
import { useToast } from '../components/Toast';
import { socket, joinAdmin } from '../services/socket';

export default function AdminContabilidad() {
  const { addToast } = useToast();
  const [resumen, setResumen] = useState({ ingresos: 0, gastos: 0, balance: 0, porCategoria: {} });
  const [transacciones, setTransacciones] = useState([]);
  const [transaccionesFiltradas, setTransaccionesFiltradas] = useState([]);
  const [pedidosPendientes, setPedidosPendientes] = useState([]);
  const [periodo, setPeriodo] = useState('dia');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showModalPago, setShowModalPago] = useState(false);
  const [showModalCierre, setShowModalCierre] = useState(false);
  const [showModalApertura, setShowModalApertura] = useState(false);
  const [showModalIngreso, setShowModalIngreso] = useState(false);
  const [formIngreso, setFormIngreso] = useState({ monto: '', descripcion: '' });
  const [historial, setHistorial] = useState([]);
  const [historialComandas, setHistorialComandas] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [mostrarHistorialComandas, setMostrarHistorialComandas] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [form, setForm] = useState({
    tipo: 'gasto',
    categoria: '',
    monto: '',
    descripcion: ''
  });
  const [formPago, setFormPago] = useState({ tipoPago: 'efectivo' });
  const [formApertura, setFormApertura] = useState({ monto: '' });
  const [estadoDia, setEstadoDia] = useState({ abierto: false, tieneApertura: false, tieneCierre: false });
  const [pedidoParaTicket, setPedidoParaTicket] = useState(null);
  const [filtroFechaComandas, setFiltroFechaComandas] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const categoriasGasto = ['Insumos', 'Servicios', 'Salarios', 'Alquiler', 'Mantenimiento', 'Otros'];

  useEffect(() => {
    fetchData();
    joinAdmin();

    socket.on('pedido-actualizado', () => {
      fetchData();
    });

    socket.on('pago-registrado', () => {
      fetchData();
    });

    socket.on('transaccion-creada', () => {
      fetchData();
    });

    return () => {
      socket.off('pedido-actualizado');
      socket.off('pago-registrado');
      socket.off('transaccion-creada');
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, [periodo]);

  useEffect(() => {
    filtrarTransacciones();
  }, [transacciones, periodo]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resumenRes, transaccionesRes, pedidosRes, mesasRes, estadoRes] = await Promise.all([
        api.get(`/transacciones/resumen?periodo=${periodo}`),
        api.get('/transacciones'),
        api.get('/pedidos'),
        api.get('/mesas'),
        api.get('/transacciones/estado-dia')
      ]);
      setResumen(resumenRes.data);
      setTransacciones(transaccionesRes.data);
      setEstadoDia(estadoRes.data);
      
      const mesaMap = {};
      mesasRes.data.forEach(m => { mesaMap[m.id] = m.numero; });
      
      const sinPagar = pedidosRes.data
        .filter(p => !p.tipoPago && p.estado !== 'cancelado')
        .map(p => ({ ...p, numeroMesa: mesaMap[p.mesaId] }));
      setPedidosPendientes(sinPagar);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtrarTransacciones = () => {
    const now = new Date();
    let inicio;

    switch (periodo) {
      case 'dia':
        inicio = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'semana':
        inicio = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'mes':
        inicio = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        inicio = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    let filtradas = transacciones.filter(t => new Date(t.createdAt) >= inicio);
    
    if (filtroCategoria) {
      filtradas = filtradas.filter(t => t.categoria === filtroCategoria);
    }
    
    setTransaccionesFiltradas(filtradas);
  };

  const aperturaDia = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transacciones', {
        tipo: 'ingreso',
        categoria: 'Apertura',
        monto: formApertura.monto,
        descripcion: 'Apertura de caja del día'
      });
      addToast('Apertura registrada correctamente', 'success');
      setShowModalApertura(false);
      setFormApertura({ monto: '' });
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al registrar apertura', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transacciones', form);
      addToast('Gasto registrado correctamente', 'success');
      setShowModal(false);
      setForm({ tipo: 'gasto', categoria: '', monto: '', descripcion: '' });
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al registrar', 'error');
    }
  };

  const registrarIngreso = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transacciones', {
        tipo: 'ingreso',
        categoria: 'Ingreso',
        monto: formIngreso.monto,
        descripcion: formIngreso.descripcion || 'Ingreso a caja'
      });
      addToast('Ingreso registrado correctamente', 'success');
      setShowModalIngreso(false);
      setFormIngreso({ monto: '', descripcion: '' });
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al registrar', 'error');
    }
  };

  const registrarPago = async (e) => {
    e.preventDefault();
    if (!pedidoSeleccionado) return;
    try {
      await api.post(`/pedidos/${pedidoSeleccionado.id}/pago`, { tipoPago: formPago.tipoPago });
      addToast('Pago registrado correctamente', 'success');
      setShowModalPago(false);
      setPedidoSeleccionado(null);
      setFormPago({ tipoPago: 'efectivo' });
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al registrar pago', 'error');
    }
  };

  const abrirPago = (pedido) => {
    setPedidoSeleccionado(pedido);
    setShowModalPago(true);
  };

  const cerrarDia = async () => {
    try {
      const res = await api.post('/transacciones/cierre', {
        fecha: new Date().toISOString().split('T')[0]
      });
      addToast(`Cierre registrado - Balance: $${res.data.balance}`, 'success');
      fetchData();
      setShowModalCierre(false);
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al cerrar el día', 'error');
    }
  };

  const fetchHistorial = async () => {
    try {
      const res = await api.get('/transacciones/historial');
      setHistorial(res.data);
      setMostrarHistorial(true);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistorialComandas = async () => {
    try {
      const res = await api.get('/transacciones/comandas');
      setHistorialComandas(res.data);
      setMostrarHistorialComandas(true);
    } catch (err) {
      console.error(err);
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
          <h1 style={{ margin: 10 }}>Caja</h1>
        </div>
        <div className="flex gap-10">
          <Link to="/admin" className="btn btn-secondary">← Volver</Link>
          <button onClick={fetchData} className="btn btn-secondary">🔄 Actualizar</button>
          <button onClick={fetchHistorialComandas} className="btn btn-secondary">📋 Comandas</button>
          <button onClick={fetchHistorial} className="btn btn-secondary">💰 Cierres</button>
          
          {estadoDia.abierto ? (
            <>
              <button 
                onClick={() => setShowModalCierre(true)} 
                className="btn btn-warning"
              >
                🔒 Cerrar Día
              </button>
              <span style={{ padding: '8px 16px', background: 'var(--success)', borderRadius: '8px', color: 'white' }}>
                ✅ Día Abierto
              </span>
            </>
          ) : estadoDia.tieneCierre ? (
            <>
              <span style={{ padding: '8px 16px', background: 'var(--gold)', borderRadius: '8px', color: 'white' }}>
                🔒 Día Cerrado
              </span>
              <button 
                onClick={() => setShowModalApertura(true)} 
                className="btn btn-success"
              >
                🔓 Nueva Apertura
              </button>
            </>
          ) : (
            <button 
              onClick={() => setShowModalApertura(true)} 
              className="btn btn-success"
            >
              🔓 Apertura de Caja
            </button>
          )}
          
          <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Gasto</button>
          <button onClick={() => setShowModalIngreso(true)} className="btn btn-success">+ Ingreso</button>
        </div>
      </div>

      <NotificacionesMozo />

      <div className="flex gap-10" style={{ marginBottom: '24px' }}>
        {['dia', 'semana', 'mes'].map(p => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={`btn ${periodo === p ? 'btn-primary' : 'btn-secondary'}`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {pedidosPendientes.length > 0 && (
        <div className="card" style={{ marginBottom: '24px', border: '2px solid var(--warning)' }}>
          <h3 style={{ marginBottom: '16px', color: 'var(--warning)' }}>⚠️ Pagos Pendientes</h3>
          <table>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Mesa</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {pedidosPendientes.map(pedido => (
                <tr key={pedido.id}>
                  <td>#{pedido.id.slice(0, 8)}</td>
                  <td>{pedido.numeroMesa || '-'}</td>
                  <td style={{ color: 'var(--warning)', fontWeight: '600' }}>${pedido.total}</td>
                  <td>
                    <span className="badge badge-pendiente">Pendiente</span>
                  </td>
                  <td>
                    <button onClick={() => abrirPago(pedido)} className="btn btn-primary" style={{ padding: '6px 12px' }}>
                      Cobrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: '12px', color: 'var(--warning)' }}>
            Total pendiente: ${pedidosPendientes.reduce((sum, p) => sum + parseFloat(p.total), 0)}
          </p>
        </div>
      )}

      <div className="grid grid-3" style={{ marginBottom: '32px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Ingresos</p>
          <h2 style={{ color: 'var(--success)' }}>${resumen.ingresos}</h2>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Gastos</p>
          <h2 style={{ color: 'var(--error)' }}>${resumen.gastos}</h2>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Balance</p>
          <h2 style={{ color: resumen.balance >= 0 ? 'var(--success)' : 'var(--error)' }}>
            ${resumen.balance}
          </h2>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-between" style={{ marginBottom: '16px' }}>
          <h3>Todas las Transacciones</h3>
          <select 
            value={filtroCategoria} 
            onChange={(e) => setFiltroCategoria(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}
          >
            <option value="">Todas las categorías</option>
            {Object.keys(resumen.porCategoria).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Monto</th>
            </tr>
          </thead>
          <tbody>
            {transaccionesFiltradas.map(trans => (
              <tr key={trans.id}>
                <td>{new Date(trans.createdAt).toLocaleDateString()}</td>
                <td>
                  <span className={`badge ${trans.tipo === 'ingreso' ? 'badge-listo' : 'badge-cancelado'}`}>
                    {trans.tipo}
                  </span>
                </td>
                <td>{trans.categoria}</td>
                <td>{trans.descripcion || '-'}</td>
                <td style={{ color: trans.tipo === 'ingreso' ? 'var(--success)' : 'var(--error)' }}>
                  {trans.tipo === 'ingreso' ? '+' : '-'}${trans.monto}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Gasto</h2>
              <button onClick={() => setShowModal(false)} className="modal-close">×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Categoría</label>
                <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} required>
                  <option value="">Seleccionar</option>
                  {categoriasGasto.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Monto</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.monto}
                  onChange={e => setForm({ ...form, monto: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <input
                  type="text"
                  value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                Registrar
              </button>
            </form>
          </div>
        </div>
      )}

      {showModalPago && pedidoSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowModalPago(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Pago</h2>
              <button onClick={() => setShowModalPago(false)} className="modal-close">×</button>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
              <p><strong>Pedido:</strong> #{pedidoSeleccionado.id.slice(0, 8)}</p>
              <p><strong>Total:</strong> ${pedidoSeleccionado.total}</p>
            </div>

            <form onSubmit={registrarPago}>
              <div className="form-group">
                <label>Método de Pago</label>
                <select value={formPago.tipoPago} onChange={e => setFormPago({ ...formPago, tipoPago: e.target.value })}>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="mercadopago">MercadoPago</option>
                  <option value="qr">QR</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                Confirmar Pago
              </button>
            </form>
          </div>
        </div>
      )}

      {showModalCierre && (
        <div className="modal-overlay" onClick={() => setShowModalCierre(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔒 Cerrar Día</h2>
              <button onClick={() => setShowModalCierre(false)} className="modal-close">×</button>
            </div>

            <p style={{ marginBottom: '20px' }}>
              ¿Está seguro de cerrar el día? Se registrará el balance total del día.
            </p>

            <div className="card" style={{ marginBottom: '20px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Balance del día</p>
              <h2 style={{ color: resumen.balance >= 0 ? 'var(--success)' : 'var(--error)' }}>
                ${resumen.balance}
              </h2>
            </div>

            <button onClick={cerrarDia} className="btn btn-warning" style={{ width: '100%', marginBottom: '12px' }}>
              Confirmar Cierre
            </button>
            <button onClick={() => setShowModalCierre(false)} className="btn btn-secondary" style={{ width: '100%' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {mostrarHistorial && (
        <div className="modal-overlay" onClick={() => setMostrarHistorial(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>📋 Historial de Cierres</h2>
              <button onClick={() => setMostrarHistorial(false)} className="modal-close">×</button>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {historial.map(h => (
                  <tr key={h.id}>
                    <td>{new Date(h.createdAt).toLocaleDateString()}</td>
                    <td style={{ color: h.tipo === 'ingreso' ? 'var(--success)' : 'var(--error)' }}>
                      {h.tipo === 'ingreso' ? '+' : '-'}${h.monto}
                    </td>
                    <td>{h.descripcion}</td>
                  </tr>
                ))}
                {historial.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center' }}>No hay cierres registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mostrarHistorialComandas && (
        <div className="modal-overlay" onClick={() => setMostrarHistorialComandas(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '85vh', overflow: 'auto' }}>
            <div className="modal-header">
              <div className="flex flex-between" style={{ width: '100%' }}>
                <h2>📋 Historial de Comandas</h2>
                <button onClick={() => setMostrarHistorialComandas(false)} className="modal-close">×</button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ marginRight: '8px' }}>Filtrar por fecha:</label>
              <input
                type="date"
                value={filtroFechaComandas}
                onChange={(e) => setFiltroFechaComandas(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}
              />
              {filtroFechaComandas && (
                <button 
                  onClick={() => setFiltroFechaComandas('')} 
                  className="btn btn-secondary"
                  style={{ marginLeft: '8px', padding: '8px 12px' }}
                >
                  Limpiar
                </button>
              )}
            </div>

            {historialComandas
              .filter(dia => !filtroFechaComandas || dia.fecha === filtroFechaComandas)
              .map(dia => (
              <div key={dia.fecha} className="card" style={{ marginBottom: '16px', borderLeft: '4px solid var(--gold)' }}>
                <div className="flex flex-between" style={{ marginBottom: '12px' }}>
                  <h3 style={{ color: 'var(--gold)' }}>{dia.fecha}</h3>
                  <div>
                    <span style={{ marginRight: '16px' }}>Pedidos: {dia.pedidos}</span>
                    <span style={{ marginRight: '16px' }}>Entregados: {dia.entregados}</span>
                    <span style={{ color: 'var(--success)', fontWeight: '600' }}>Total: ${dia.total.toFixed(2)}</span>
                  </div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Mesa</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th>Pago</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dia.detalle.map(p => (
                      <tr key={p.id}>
                        <td>#{p.id.slice(0, 8)}</td>
                        <td>Mesa {p.mesa}</td>
                        <td>${p.total}</td>
                        <td>
                          <span className={`badge badge-${p.estado}`}>{p.estado}</span>
                        </td>
                        <td>{p.tipoPago || 'Pendiente'}</td>
                        <td>
                          {p.tipoPago && (
                            <button 
                              onClick={async () => {
                                try {
                                  const res = await api.get(`/pedidos/${p.id}`);
                                  setPedidoParaTicket(res.data);
                                } catch (err) {
                                  addToast('Error al cargar datos del pedido', 'error');
                                }
                              }}
                              className="btn btn-primary"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                              🖨️ Ticket
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

            {historialComandas.filter(dia => !filtroFechaComandas || dia.fecha === filtroFechaComandas).length === 0 && (
              <p style={{ textAlign: 'center', padding: '20px' }}>No hay comandas registradas para esta fecha</p>
            )}
          </div>
        </div>
      )}

      {pedidoParaTicket && (
        <TicketPrint pedido={pedidoParaTicket} onClose={() => setPedidoParaTicket(null)} />
      )}

      {showModalApertura && (
        <div className="modal-overlay" onClick={() => setShowModalApertura(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔓 Apertura de Caja</h2>
              <button onClick={() => setShowModalApertura(false)} className="modal-close">×</button>
            </div>

            <p style={{ marginBottom: '20px' }}>
              Ingrese el monto inicial en caja para comenzar el día.
            </p>

            <form onSubmit={aperturaDia}>
              <div className="form-group">
                <label>Monto en Caja</label>
                <input
                  type="number"
                  step="0.01"
                  value={formApertura.monto}
                  onChange={e => setFormApertura({ monto: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn btn-success" style={{ width: '100%', marginTop: '16px' }}>
                Confirmar Apertura
              </button>
            </form>
          </div>
        </div>
      )}

      {showModalIngreso && (
        <div className="modal-overlay" onClick={() => setShowModalIngreso(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💰 Ingreso a Caja</h2>
              <button onClick={() => setShowModalIngreso(false)} className="modal-close">×</button>
            </div>

            <p style={{ marginBottom: '20px' }}>
              Registrá dinero que entra a caja (propinas, compensaciones, etc.)
            </p>

            <form onSubmit={registrarIngreso}>
              <div className="form-group">
                <label>Monto</label>
                <input
                  type="number"
                  step="0.01"
                  value={formIngreso.monto}
                  onChange={e => setFormIngreso({ ...formIngreso, monto: e.target.value })}
                  placeholder="Ej: 5000"
                  required
                />
              </div>

              <div className="form-group">
                <label>Descripción (opcional)</label>
                <input
                  type="text"
                  value={formIngreso.descripcion}
                  onChange={e => setFormIngreso({ ...formIngreso, descripcion: e.target.value })}
                  placeholder="Ej: Propina, Compensación, etc."
                />
              </div>

              <button type="submit" className="btn btn-success" style={{ width: '100%', marginTop: '16px' }}>
                Confirmar Ingreso
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

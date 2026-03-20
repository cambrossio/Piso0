import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { socket, joinAdmin } from '../services/socket';
import NotificacionesMozo from '../components/NotificacionesMozo';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    pedidosActivos: 0,
    mesasOcupadas: 0,
    stockBajo: 0,
    ingresosDia: 0
  });
  const [pedidosRecientes, setPedidosRecientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!usuario || usuario.rol !== 'admin') {
      navigate('/login');
      return;
    }

    joinAdmin();
    fetchData();

    socket.on('nuevo-pedido', (pedido) => {
      setPedidosRecientes(prev => [pedido, ...prev].slice(0, 10));
      setStats(prev => ({ ...prev, pedidosActivos: prev.pedidosActivos + 1 }));
    });

    socket.on('pedido-actualizado', (pedido) => {
      fetchData();
    });

    return () => {
      socket.off('nuevo-pedido');
      socket.off('pedido-actualizado');
    };
  }, [usuario, navigate]);

  const fetchData = async () => {
    try {
      const [pedidosRes, mesasRes, productosRes, transaccionesRes] = await Promise.all([
        api.get('/pedidos'),
        api.get('/mesas'),
        api.get('/productos'),
        api.get('/transacciones/resumen?periodo=dia')
      ]);

      const mesaMap = {};
      mesasRes.data.forEach(m => { mesaMap[m.id] = m.numero; });

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      const pedidosHoy = pedidosRes.data.filter(p => new Date(p.createdAt) >= hoy);

      const pedidosConNumero = pedidosHoy.map(p => ({
        ...p,
        numeroMesa: mesaMap[p.mesaId] || p.mesaId
      }));

      const pedidosActivos = pedidosHoy.filter(p => 
        ['pendiente', 'preparando', 'listo'].includes(p.estado)
      ).length;

      const mesasOcupadas = mesasRes.data.filter(m => m.estado === 'ocupada').length;
      
      const stockBajo = productosRes.data.filter(p => p.stock <= p.stockMinimo).length;

      setStats({
        pedidosActivos,
        mesasOcupadas,
        stockBajo,
        ingresosDia: transaccionesRes.data.ingresos || 0
      });

      setPedidosRecientes(pedidosConNumero.slice(0, 10));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
          <h1 style={{ margin: 0 }}>Dashboard</h1>
        </div>
        <div className="flex gap-10">
          <Link to="/admin/pedidos" className="btn btn-primary">Ver Pedidos</Link>
          <button onClick={logout} className="btn btn-secondary">Cerrar Sesión</button>
        </div>
      </div>

      <nav style={{ marginBottom: '32px' }}>
        <div className="flex gap-10" style={{ flexWrap: 'wrap' }}>
          <Link to="/admin" className="btn btn-secondary">Dashboard</Link>
          <Link to="/admin/productos" className="btn btn-secondary">Productos</Link>
          <Link to="/admin/mesas" className="btn btn-secondary">Mesas</Link>
          <Link to="/admin/pedidos" className="btn btn-secondary">Pedidos</Link>
          <Link to="/admin/contabilidad" className="btn btn-secondary">Contabilidad</Link>
          <Link to="/admin/administracion" className="btn btn-secondary">Administración</Link>
          <Link to="/admin/configuracion" className="btn btn-secondary">Configuración</Link>
        </div>
      </nav>

      <div className="grid grid-4" style={{ marginBottom: '32px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Pedidos Activos</p>
          <h2 style={{ color: 'var(--accent)' }}>{stats.pedidosActivos}</h2>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Mesas Ocupadas</p>
          <h2 style={{ color: 'var(--warning)' }}>{stats.mesasOcupadas}</h2>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Stock Bajo</p>
          <h2 style={{ color: stats.stockBajo > 0 ? 'var(--error)' : 'var(--success)' }}>{stats.stockBajo}</h2>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Ingresos del Día</p>
          <h2 style={{ color: 'var(--success)' }}>${stats.ingresosDia}</h2>
        </div>
      </div>

      <NotificacionesMozo />

      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>Pedidos Recientes</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Mesa</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {pedidosRecientes.map(pedido => (
              <tr key={pedido.id}>
                <td>#{pedido.id.slice(0, 8)}</td>
                <td>Mesa {pedido.numeroMesa || pedido.mesaId?.slice(0, 8)}</td>
                <td>${pedido.total}</td>
                <td>
                  <span className={`badge badge-${pedido.estado}`}>
                    {pedido.estado}
                  </span>
                </td>
                <td>{new Date(pedido.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

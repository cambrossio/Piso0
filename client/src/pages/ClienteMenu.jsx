import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { socket, joinMesa } from '../services/socket';
import { useToast } from '../components/Toast';

export default function ClienteMenu() {
  const { addToast } = useToast();
  const { codigoQR } = useParams();
  const [mesa, setMesa] = useState(null);
  const [productos, setProductos] = useState([]);
  const [categorias] = useState(['bebida', 'comida', 'postre', 'otro']);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('bebida');
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pedidosActivos, setPedidosActivos] = useState([]);
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [pedidoAAgregar, setPedidoAAgregar] = useState(null);
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mesaRes, productosRes, pedidosRes] = await Promise.all([
          api.get(`/mesas/qr/${codigoQR}`),
          api.get('/productos?disponible=true'),
          api.get(`/pedidos/mesa/${codigoQR}`)
        ]);
        setMesa(mesaRes.data);
        setProductos(productosRes.data);
        joinMesa(mesaRes.data.id);
        localStorage.setItem('mesaCodigoQR', codigoQR);
        localStorage.setItem('mesaNumero', mesaRes.data.numero);
        
        const pedidosTodos = pedidosRes.data.filter(p => p.estado !== 'cancelado');
        const misPedidos = pedidosTodos.filter(p => p.clienteId === usuario.id);
        
        if (mesaRes.data.estado === 'ocupada' && misPedidos.length === 0) {
          addToast('Esta mesa está ocupada', 'error');
          navigate('/scan');
          return;
        }
        
        const pedidosMostrar = misPedidos.filter(p => 
          p.estado !== 'cancelado' && !(p.estado === 'entregado' && p.tipoPago)
        );
        
        setPedidosActivos(pedidosMostrar);
        localStorage.setItem('pedidosActivos', JSON.stringify(pedidosMostrar));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [codigoQR]);

  useEffect(() => {
    const handlePedidoActualizado = () => {
      api.get(`/pedidos/mesa/${codigoQR}`).then(res => {
        const pedidos = res.data.filter(p => 
          p.estado !== 'cancelado' && !(p.estado === 'entregado' && p.tipoPago)
        );
        setPedidosActivos(pedidos);
        localStorage.setItem('pedidosActivos', JSON.stringify(pedidos));
      });
    };

    socket.on('pedido-actualizado', handlePedidoActualizado);
    return () => socket.off('pedido-actualizado', handlePedidoActualizado);
  }, [codigoQR]);

  const tienePedidoPendiente = pedidosActivos.some(p => p.estado === 'pendiente');

  const agregarAlCarrito = (producto) => {
    const existente = carrito.find(item => item.productoId === producto.id);
    if (existente) {
      setCarrito(carrito.map(item => 
        item.productoId === producto.id 
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setCarrito([...carrito, {
        productoId: producto.id,
        productoNombre: producto.nombre,
        precioUnitario: producto.precio,
        cantidad: 1,
        notas: ''
      }]);
    }
  };

  const removerDelCarrito = (productoId) => {
    const existente = carrito.find(item => item.productoId === productoId);
    if (existente && existente.cantidad > 1) {
      setCarrito(carrito.map(item => 
        item.productoId === productoId 
          ? { ...item, cantidad: item.cantidad - 1 }
          : item
      ));
    } else {
      setCarrito(carrito.filter(item => item.productoId !== productoId));
    }
  };

  const totalCarrito = carrito.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);

  const confirmarPedido = async () => {
    if (carrito.length === 0) return;
    
    if (tienePedidoPendiente) {
      setMostrarSelector(true);
      return;
    }
    
    crearNuevoPedido();
  };

  const crearNuevoPedido = async () => {
    try {
      const pedidoData = {
        mesaId: mesa.id,
        clienteId: usuario.id,
        items: carrito
      };
      
      const res = await api.post('/pedidos', pedidoData);
      const pedidoConMesa = { ...res.data, numeroMesa: mesa.numero };
      localStorage.setItem('pedidoActual', JSON.stringify(pedidoConMesa));
      addToast('Pedido creado correctamente', 'success');
      navigate('/pedido');
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al crear pedido', 'error');
    }
  };

  const agregarAPedido = async (pedidoId) => {
    try {
      await api.put(`/pedidos/${pedidoId}/agregar`, { items: carrito });
      addToast('Productos agregados al pedido', 'success');
      setCarrito([]);
      setMostrarSelector(false);
      const pedidosRes = await api.get(`/pedidos/mesa/${codigoQR}`);
      const pedidos = pedidosRes.data.filter(p => 
        !['entregado', 'cancelado'].includes(p.estado)
      );
      setPedidosActivos(pedidos);
      localStorage.setItem('pedidosActivos', JSON.stringify(pedidos));
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al agregar productos', 'error');
    }
  };

  const productosFiltrados = productos.filter(p => p.categoria === categoriaSeleccionada);

  if (loading) {
    return <div className="container">Cargando...</div>;
  }

  if (!mesa) {
    return (
      <div className="container">
        <h2>Mesa no encontrada</h2>
        <button onClick={() => navigate('/scan')} className="btn btn-primary">Volver</button>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '140px' }}>
      <div className="flex flex-between" style={{ marginBottom: '16px' }}>
        <h2>🍽️ Mesa {mesa.numero}</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => {
              socket.emit('solicitar-mozo', { 
                mesaId: mesa.id,
                numeroMesa: mesa.numero
              });
              addToast('Mozo solicitado', 'warning');
            }} 
            className="btn btn-secondary"
            style={{ padding: '8px 12px', fontSize: '12px' }}
          >
            📞 Mozo
          </button>
          <button onClick={() => navigate('/scan')} className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '12px' }}>Cambiar</button>
        </div>
      </div>

      {pedidosActivos.length > 0 && (
        <div className="card" style={{ marginBottom: '16px', padding: '12px' }}>
          <h4 style={{ marginBottom: '8px', color: 'var(--gold)' }}>Mis Pedidos</h4>
          {pedidosActivos.map(pedido => (
            <div key={pedido.id} 
              onClick={() => {
                localStorage.setItem('pedidoActual', JSON.stringify({...pedido, numeroMesa: mesa.numero}));
                navigate('/pedido');
              }}
              style={{ 
                padding: '8px', 
                marginBottom: '6px', 
                background: 'var(--secondary)', 
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <div className="flex flex-between">
                <span style={{ fontSize: '13px' }}>#{pedido.id.slice(0, 6)}</span>
                <span className={`badge badge-${pedido.estado}`}>{pedido.estado}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-10" style={{ marginBottom: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
        {categorias.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoriaSeleccionada(cat)}
            className={`btn ${categoriaSeleccionada === cat ? 'btn-primary' : 'btn-secondary'}`}
            style={{ whiteSpace: 'nowrap', textTransform: 'capitalize', padding: '8px 14px', fontSize: '13px' }}
          >
            {cat}
          </button>
        ))}
      </div>

      <h3 style={{ marginBottom: '12px', textTransform: 'capitalize' }}>{categoriaSeleccionada}s</h3>
      
      <div className="grid grid-2" style={{ gap: '10px', marginBottom: '16px' }}>
        {productosFiltrados.map(producto => (
          <div key={producto.id} className="card" style={{ padding: '12px' }}>
            <h4 style={{ marginBottom: '4px', fontSize: '14px' }}>{producto.nombre}</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>
              {producto.descripcion}
            </p>
            <div className="flex flex-between" style={{ alignItems: 'center' }}>
              <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--accent)' }}>
                ${producto.precio}
              </span>
              <button 
                onClick={() => agregarAlCarrito(producto)}
                className="btn btn-primary"
                style={{ padding: '8px 16px' }}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {carrito.length > 0 && (
        <div className="fixed-cart">
          <div className="card" style={{ padding: '12px', position: 'fixed', bottom: '10px', left: '10px', right: '10px', zIndex: 100 }}>
            <div className="flex flex-between" style={{ marginBottom: '10px' }}>
              <span>Items: {carrito.reduce((sum, i) => sum + i.cantidad, 0)}</span>
              <strong style={{ color: 'var(--gold)', fontSize: '18px' }}>${totalCarrito}</strong>
            </div>
            <button onClick={confirmarPedido} className="btn btn-primary" style={{ width: '100%' }}>
              {tienePedidoPendiente ? 'Agregar a Mi Pedido' : 'Enviar Pedido'}
            </button>
          </div>
        </div>
      )}

      {mostrarSelector && (
        <div className="modal-overlay" onClick={() => setMostrarSelector(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Agregar a pedido</h2>
              <button onClick={() => setMostrarSelector(false)} className="modal-close">×</button>
            </div>

            {pedidosActivos.filter(p => p.estado === 'pendiente').map(pedido => (
              <button
                key={pedido.id}
                onClick={() => agregarAPedido(pedido.id)}
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: '10px' }}
              >
                Agregar a #{pedido.id.slice(0, 6)}
              </button>
            ))}

            <button
              onClick={() => { crearNuevoPedido(); setMostrarSelector(false); }}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              Crear Nuevo Pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
